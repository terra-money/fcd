import * as sentry from '@sentry/node'
import { collectorLogger as logger } from 'lib/logger'
import RPCWatcher, { RpcResponse } from 'lib/RPCWatcher'
import config from 'config'
import { collectBlock } from './block'

const SOCKET_URL = `${config.RPC_URI.replace('http', 'ws')}/websocket`
const NEW_BLOCK_Q = `tm.event='NewBlock'`

async function processNewBlock(data: RpcResponse) {
  const marshalTxs = data.result.data?.value.block?.data.txs as string[]
  // const height = data.result.data?.value.block?.header.height as string

  if (marshalTxs) {
    // try {
    // } catch (err) {
    //   sentry.captureException(err)
    // }
  }
}

let blockUpdated = true

async function checkBlock() {
  if (!blockUpdated) {
    setTimeout(checkBlock, 50)
    return
  }

  blockUpdated = false
  await collectBlock().catch(sentry.captureException)
  setTimeout(checkBlock, 50)
}

export async function start() {
  let eventCounter = 0

  const watcher = new RPCWatcher({
    url: SOCKET_URL,
    logger
  })

  watcher.registerSubscriber(NEW_BLOCK_Q, async (resp: RpcResponse) => {
    eventCounter += 1
    blockUpdated = true
    await processNewBlock(resp).catch(sentry.captureException)
  })

  await watcher.start()

  const checkRestart = async () => {
    if (eventCounter === 0) {
      logger.info('watcher: event counter is zero. restarting..')
      watcher.restart()
      return
    }

    eventCounter = 0
    setTimeout(checkRestart, 20000)
  }

  setTimeout(checkRestart, 20000)
  setTimeout(checkBlock, 1000)
}
