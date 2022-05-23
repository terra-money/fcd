import { getRepository } from 'typeorm'
import { subDays } from 'date-fns'

import { RewardEntity } from 'orm'

import { getLatestDateOfReward, convertDbTimestampToDate } from './helpers'

interface RewardsByDateReturn {
  date: string
  denom: string
  gas_sum: string
  reward_sum: string
  commission_sum: string
}

export async function getRewardSumByDateDenom(daysBefore?: number): Promise<RewardsByDateReturn[]> {
  const latestDate = await getLatestDateOfReward()
  const rewardQb = getRepository(RewardEntity)
    .createQueryBuilder()
    .select(convertDbTimestampToDate('datetime'), 'date')
    .addSelect('denom', 'denom')
    .addSelect('SUM(fee)', 'gas_sum')
    .addSelect('SUM(reward)', 'reward_sum')
    .addSelect('SUM(commission)', 'commission_sum')
    .groupBy('date')
    .addGroupBy('denom')
    .orderBy('date', 'ASC')
    .where('datetime < :today', { today: latestDate })

  if (daysBefore) {
    rewardQb.andWhere('datetime >= :from', { from: subDays(latestDate, daysBefore) })
  }

  const rewards: RewardsByDateReturn[] = await rewardQb.getRawMany()

  return rewards
}
