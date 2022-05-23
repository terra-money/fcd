import { init as initORM } from 'orm'
import * as nodeCron from 'node-cron'
import { get } from 'lodash'
import { default as parseDuration } from 'parse-duration'

import { collectorLogger as logger } from 'lib/logger'
import { init as initErrorReport } from 'lib/errorReport'
import Semaphore from 'lib/Semaphore'
import { init as initToken } from 'service/token'

import { collectBlock } from './block'
import { collectDashboard } from './dashboard'
import { start as startWatcher } from './watcher'

process.on('unhandledRejection', (err) => {
  logger.error({
    type: 'SYSTEM_ERROR',
    message: get(err, 'message'),
    stack: get(err, 'stack')
  })
})

// const tenMinute = parseDuration('10m')
const twentyMinute = parseDuration('20m')

const dashboardCollector = new Semaphore('DashboardCollector', collectDashboard, logger, twentyMinute)

const jobs = [
  {
    method: dashboardCollector.run.bind(dashboardCollector),
    cron: '0 20 0 * * *'
  }
]

async function createJobs() {
  for (const job of jobs) {
    nodeCron.schedule(job.cron, job.method)
  }
}

const init = async () => {
  initErrorReport()
  await initORM()
  await initToken()
  await collectBlock()
  await createJobs()
  await startWatcher()
}

init().catch(logger.error)
