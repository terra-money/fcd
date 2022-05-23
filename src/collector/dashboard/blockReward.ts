import { plus } from 'lib/math'
import { getRewardSumByDateDenom } from './rewardsInfo'

// key: date in format yyyy-MM-dd
// value: big int string format
interface RewardByDateMap {
  [date: string]: string
}

export async function getBlockRewardByDate(daysBefore?: number): Promise<RewardByDateMap> {
  const rewards = await getRewardSumByDateDenom(daysBefore)

  const rewardObj: RewardByDateMap = rewards.reduce((acc, item) => {
    if (acc[item.date]) {
      acc[item.date] = plus(acc[item.date], item.reward_sum)
    } else {
      acc[item.date] = item.reward_sum
    }
    return acc
  }, {} as RewardByDateMap)

  return rewardObj
}
