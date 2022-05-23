import { getRepository, EntityManager } from 'typeorm'
import { GeneralInfoEntity } from 'orm'
import { div } from 'lib/math'
import * as lcd from 'lib/lcd'
import { getStartOfPreviousMinuteTs } from 'lib/time'
import { collectorLogger as logger } from 'lib/logger'

export async function collectGeneral(mgr: EntityManager, timestamp: number, strHeight: string) {
  const [communityPool, { bondedTokens, notBondedTokens, issuances, stakingRatio }] = await Promise.all([
    lcd.getCommunityPool(strHeight).then(
      (pool): DenomMap =>
        Array.isArray(pool)
          ? pool.reduce((acc, { denom, amount }) => {
              acc[denom] = amount
              return acc
            }, {})
          : {}
    ),
    Promise.all([lcd.getStakingPool(strHeight), lcd.getAllActiveIssuance(strHeight)]).then((results) => {
      const [{ bonded_tokens: bondedTokens, not_bonded_tokens: notBondedTokens }, issuances] = results
      return { bondedTokens, notBondedTokens, issuances, stakingRatio: div(bondedTokens, issuances['uluna']) }
    })
  ])
  const datetime = new Date(getStartOfPreviousMinuteTs(timestamp))

  const genInfo: Partial<GeneralInfoEntity> = {
    datetime,
    stakingRatio: stakingRatio ? Number(stakingRatio) : NaN,
    bondedTokens,
    notBondedTokens,
    issuances,
    communityPool
  }

  const prevGenInfo = await getRepository(GeneralInfoEntity).findOne({
    datetime
  })

  if (prevGenInfo) {
    await mgr.update(GeneralInfoEntity, prevGenInfo.id, genInfo)
  } else {
    await mgr.insert(GeneralInfoEntity, genInfo)
  }

  logger.info(`collectGeneral: ${genInfo.datetime}`)
}
