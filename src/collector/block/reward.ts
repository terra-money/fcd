import * as Bluebird from 'bluebird'
import { getRepository, EntityManager } from 'typeorm'
import { mergeWith } from 'lodash'

import config from 'config'
import { TxEntity, RewardEntity, BlockEntity } from 'orm'

import * as lcd from 'lib/lcd'
import { collectorLogger as logger } from 'lib/logger'
import { plus } from 'lib/math'
import { getDateRangeOfLastMinute, getQueryDateTime, getStartOfPreviousMinuteTs } from 'lib/time'

import { addDatetimeFilterToQuery } from './helper'

function getFee(tx: TxEntity): DenomMap {
  const amount = tx.data.tx.auth_info.fee.amount

  return (amount || []).reduce((acc, item) => {
    acc[item.denom] = acc[item.denom] ? plus(acc[item.denom], item.amount) : item.amount
    return acc
  }, {})
}

async function getFees(timestamp: number): Promise<DenomMap> {
  const qb = getRepository(TxEntity).createQueryBuilder('tx').select(`tx.data`)
  addDatetimeFilterToQuery(timestamp, qb)

  const txs = await qb.getMany()
  const rewardMerger = (obj, src) => mergeWith(obj, src, (o, s) => plus(o, s))

  return txs.reduce((acc, tx) => rewardMerger(acc, getFee(tx)), {})
}

interface Rewards {
  reward: DenomMap
  commission: DenomMap
}

export async function getRewards(timestamp: number): Promise<Rewards> {
  const result: Rewards = { reward: {}, commission: {} }
  const { from, to } = getDateRangeOfLastMinute(timestamp)
  const qb = getRepository(BlockEntity)
    .createQueryBuilder('block')
    .leftJoinAndSelect('block.reward', 'reward')
    .andWhere(`block.timestamp >= '${getQueryDateTime(from)}'`)
    .andWhere(`block.timestamp < '${getQueryDateTime(to)}'`)

  const blocks: BlockEntity[] = await qb.getMany()

  if (!blocks.length) {
    return result
  }

  const lastBlock = await getRepository(BlockEntity).findOne({
    chainId: config.CHAIN_ID,
    height: blocks[blocks.length - 1].height + 1
  })

  if (lastBlock) {
    blocks.push(lastBlock)
  }

  blocks.shift()

  const rewardMerger = (obj, src) => mergeWith(obj, src, (o, s) => plus(o, s))

  return blocks.reduce((acc, block) => {
    const reward = block.reward.reward
    const commission = block.reward.commission
    return mergeWith(acc, { reward, commission }, rewardMerger)
  }, result)
}

export async function collectReward(mgr: EntityManager, timestamp: number, strHeight: string) {
  const { reward: rewardSum, commission } = await getRewards(timestamp)
  const datetime = new Date(getStartOfPreviousMinuteTs(timestamp))
  const [issuances, fees] = await Promise.all([lcd.getAllActiveIssuance(strHeight), getFees(timestamp)])

  await Bluebird.map(Object.keys(issuances), async (denom) => {
    const reward = new RewardEntity()

    reward.denom = denom
    reward.datetime = datetime
    reward.fee = fees[denom] || '0.0'
    reward.reward = rewardSum[denom] || '0.0'
    reward.commission = commission[denom] || '0.0'

    const existing = await mgr.findOne(RewardEntity, { denom, datetime })

    if (existing) {
      mgr.update(RewardEntity, existing.id, reward)
    } else {
      mgr.insert(RewardEntity, reward)
    }
  })

  logger.info(`collectReward: ${datetime}`)
}
