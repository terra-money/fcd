import { getRepository } from 'typeorm'
import { parseISO, startOfDay } from 'date-fns'
import config from 'config'
import { DashboardEntity, init as initORM } from 'orm'

import {
  getBlockRewardByDate,
  getAccountCountByDate,
  getTxVolumeByDate,
  getAvgBondedTokenByDate
} from 'collector/dashboard'

async function getDashboard(datetime: Date): Promise<DashboardEntity | undefined> {
  const dashboard = await getRepository(DashboardEntity).findOne({
    chainId: config.CHAIN_ID,
    timestamp: datetime
  })
  return dashboard
}

async function populateDashboard() {
  await initORM()

  const accountGrowth = await getAccountCountByDate()

  for (const dateKey of Object.keys(accountGrowth)) {
    const date = startOfDay(parseISO(dateKey))
    const dashboard = await getDashboard(date)
    if (dashboard) {
      console.log('updating ac growth date ', dateKey)
      await getRepository(DashboardEntity).update(dashboard.id, {
        activeAccount: accountGrowth[dateKey].activeAccount,
        totalAccount: accountGrowth[dateKey].totalAccount
      })
    } else {
      console.log('New insert of ac growth ', dateKey)
      await getRepository(DashboardEntity).save({
        timestamp: date,
        chainId: config.CHAIN_ID,
        activeAccount: accountGrowth[dateKey].activeAccount,
        totalAccount: accountGrowth[dateKey].totalAccount
      })
    }
  }

  // save block rewards.
  const blockReward = await getBlockRewardByDate()

  for (const dateKey of Object.keys(blockReward)) {
    const date = startOfDay(parseISO(dateKey))
    const dashboard = await getDashboard(date)
    if (dashboard) {
      console.log('updating reward of date ', dateKey)
      await getRepository(DashboardEntity).update(dashboard.id, {
        reward: blockReward[dateKey]
      })
    } else {
      console.log('New insert tax reward of ', dateKey)
      await getRepository(DashboardEntity).save({
        timestamp: date,
        chainId: config.CHAIN_ID,
        blockReward: blockReward[dateKey]
      })
    }
  }

  // save tx volume
  const txVolumes = await getTxVolumeByDate()
  for (const dateKey of Object.keys(txVolumes)) {
    const date = startOfDay(parseISO(dateKey))
    const dashboard = await getDashboard(date)
    if (dashboard) {
      console.log('updating tx volume of date ', dateKey)
      await getRepository(DashboardEntity).update(dashboard.id, {
        txVolume: txVolumes[dateKey]
      })
    } else {
      console.log('New insert  tx volume of ', dateKey)
      await getRepository(DashboardEntity).save({
        timestamp: date,
        chainId: config.CHAIN_ID,
        txVolume: txVolumes[dateKey]
      })
    }
  }

  const avgStaking = await getAvgBondedTokenByDate()

  for (const dateKey of Object.keys(avgStaking)) {
    const date = startOfDay(parseISO(dateKey))
    const dashboard = await getDashboard(date)
    if (dashboard) {
      console.log('updating staking of date ', dateKey)
      await getRepository(DashboardEntity).update(dashboard.id, {
        avgStaking: avgStaking[dateKey]
      })
    } else {
      console.log('New insert staking of ', dateKey)
      await getRepository(DashboardEntity).save({
        timestamp: date,
        chainId: config.CHAIN_ID,
        avgStaking: avgStaking[dateKey]
      })
    }
  }
}

populateDashboard().catch(console.error)
