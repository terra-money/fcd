import { startOfToday, subDays, addDays } from 'date-fns'
import { getRepository } from 'typeorm'

import { getDateFromDateTime } from 'lib/time'
import { collectorLogger as logger } from 'lib/logger'

import config from 'config'
import { DashboardEntity } from 'orm'

import { getAvgBondedTokenByDate } from './avgBondedToken'
import { getAccountCountByDate } from './accountGrowth'
import { getBlockRewardByDate } from './blockReward'
import { getTxVolumeByDate } from './txVolume'

const PREVIOUS_DAYS_TO_CALCULATE = 3

export async function collectDashboard(updateExisting = false) {
  logger.info('Dashboard collector started...')

  const to = startOfToday()
  const from = subDays(to, PREVIOUS_DAYS_TO_CALCULATE)

  const [accountGrowth, blockReward, avgBondedToken, transactionVol] = await Promise.all([
    getAccountCountByDate(PREVIOUS_DAYS_TO_CALCULATE),
    getBlockRewardByDate(PREVIOUS_DAYS_TO_CALCULATE),
    getAvgBondedTokenByDate(PREVIOUS_DAYS_TO_CALCULATE),
    getTxVolumeByDate(PREVIOUS_DAYS_TO_CALCULATE)
  ])

  for (let dayIt = from; dayIt < to; dayIt = addDays(dayIt, 1)) {
    let dashboard = await getRepository(DashboardEntity).findOne({
      chainId: config.CHAIN_ID,
      timestamp: dayIt
    })

    if (dashboard) {
      if (!updateExisting) {
        logger.info(`Dashboard exists: ${dayIt.toISOString()}`)
        continue
      }
    } else {
      dashboard = new DashboardEntity()
    }

    const dateKey = getDateFromDateTime(dayIt)

    dashboard.timestamp = dayIt
    dashboard.chainId = config.CHAIN_ID
    dashboard.txVolume = transactionVol[dateKey]
    dashboard.avgStaking = avgBondedToken[dateKey]
    dashboard.reward = blockReward[dateKey]
    dashboard.activeAccount = accountGrowth[dateKey]?.activeAccount
    dashboard.totalAccount = accountGrowth[dateKey]?.totalAccount

    await getRepository(DashboardEntity)
      .save(dashboard)
      .then(() => {
        logger.info(`Dashboard saved: ${dayIt.toISOString()}`)
      })
      .catch((error) => {
        logger.error(`Dashboard save failed: ${dayIt.toISOString()} ${error.message}`)
      })
  }

  logger.info('Dashboard collector finished')
}
