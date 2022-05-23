import { getRepository } from 'typeorm'
import { GeneralInfoEntity } from 'orm'

interface StakingPoolInfo {
  stakingRatio: string // bigint value
  bondedTokens: string // bigint value
  notBondedTokens: string // bigint value
}

interface GeneralInfoReturn {
  issuances: DenomMap
  communityPool: DenomMap
  stakingPool: StakingPoolInfo
}

async function getLatestGenInfo(): Promise<GeneralInfoEntity> {
  return await getRepository(GeneralInfoEntity).findOneOrFail({
    order: {
      datetime: 'DESC'
    }
  })
}

export default async function getGeneralInfo(): Promise<GeneralInfoReturn> {
  const latestInfo = await getLatestGenInfo()
  const { issuances, communityPool, bondedTokens, notBondedTokens, stakingRatio } = latestInfo

  return {
    issuances,
    stakingPool: {
      stakingRatio: stakingRatio.toString(),
      bondedTokens,
      notBondedTokens
    },
    communityPool
  }
}
