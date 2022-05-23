import * as Bluebird from 'bluebird'
import { TxEntity, NetworkEntity } from 'orm'
import { getRepository, EntityManager } from 'typeorm'

import * as lcd from 'lib/lcd'
import { collectorLogger as logger } from 'lib/logger'
import { plus } from 'lib/math'
import { getStartOfPreviousMinuteTs } from 'lib/time'
import { isSuccessfulTx } from 'lib/tx'
import { addDatetimeFilterToQuery } from './helper'
import { splitDenomAndAmount } from 'lib/common'

async function getVolumeFromEvent(timestamp: number): Promise<DenomMap> {
  const qb = getRepository(TxEntity).createQueryBuilder('tx')

  addDatetimeFilterToQuery(timestamp, qb)

  const txs = await qb.getMany()

  const amounts = txs
    .map((tx: TxEntity) => {
      const lcdTx = tx.data
      const logs = lcdTx.logs

      if (isSuccessfulTx(lcdTx) && logs) {
        const amounts = logs
          .map((log) =>
            (log.events || [])
              .filter((ev) => ev.type === 'transfer')
              .map((ev) => ev.attributes.filter((attr) => attr.key === 'amount').map((attr) => attr.value))
              .flat()
          )
          .flat()

        return amounts
      }

      return []
    })
    .filter((am) => Array.isArray(am) && am.length)
    .flat()

  return amounts.reduce((p, c) => {
    const { amount, denom } = splitDenomAndAmount(c)
    p[denom] = plus(p[denom] || '0', amount)
    return p
  }, {})
}

export async function getTxVol(timestamp: number) {
  return getVolumeFromEvent(timestamp)
}

export async function collectNetwork(mgr: EntityManager, timestamp: number, strHeight: string) {
  const ts = getStartOfPreviousMinuteTs(timestamp)
  const [activeIssuances, volumeObj] = await Promise.all([lcd.getAllActiveIssuance(strHeight), getTxVol(timestamp)])

  const marketCapObj = activeIssuances
  const datetime = new Date(ts)

  await Bluebird.map(Object.keys(activeIssuances), async (denom) => {
    const network = new NetworkEntity()

    network.denom = denom
    network.datetime = datetime
    network.supply = activeIssuances[denom]
    network.marketCap = marketCapObj[denom]
    network.txvolume = volumeObj[denom] ? volumeObj[denom] : '0'

    const existing = await mgr.findOne(NetworkEntity, { denom, datetime })

    if (existing) {
      return mgr.update(NetworkEntity, existing.id, network)
    } else {
      return mgr.insert(NetworkEntity, network)
    }
  })

  logger.info(`collectNetwork: ${datetime}`)
}
