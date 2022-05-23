import { getRepository } from 'typeorm'
import { subDays } from 'date-fns'
import * as lcd from 'lib/lcd'
import { times } from 'lib/math'
import { GeneralInfoEntity } from 'orm'
import { convertDbTimestampToDate, getLatestDateOfGeneralInfo } from './helpers'

export async function getAvgBondedTokenByDate(daysBefore?: number): Promise<{
  [date: string]: string
}> {
  const latestDate = await getLatestDateOfGeneralInfo()
  const issuance = (await lcd.getTotalSupply()).find((e) => e.denom === 'uluna')?.amount || '0'
  const stakingQb = getRepository(GeneralInfoEntity)
    .createQueryBuilder()
    .select(convertDbTimestampToDate('datetime'), 'date')
    .addSelect('AVG(staking_ratio)', 'avg_staking_ratio')
    .addSelect('AVG(bonded_tokens)', 'avg_bonded_tokens')
    .groupBy('date')
    .orderBy('date', 'DESC')
    .where('datetime < :today', { today: latestDate })

  if (daysBefore) {
    stakingQb.andWhere('datetime >= :from', { from: subDays(latestDate, daysBefore) })
  }

  const bondedTokens = await stakingQb.getRawMany()

  const bondedTokensObj = bondedTokens.reduce((acc, item) => {
    acc[item.date] = item.avg_bonded_tokens ? item.avg_bonded_tokens : times(issuance, item.avg_staking_ratio)
    return acc
  }, {})
  return bondedTokensObj
}
