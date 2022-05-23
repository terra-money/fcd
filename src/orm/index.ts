import 'reflect-metadata'
import * as Bluebird from 'bluebird'
import { createConnection, ConnectionOptions, ConnectionOptionsReader, Connection } from 'typeorm'
import { PostgresConnectionOptions } from 'typeorm/driver/postgres/PostgresConnectionOptions'
import * as CamelToSnakeNamingStrategy from './CamelToSnakeNamingStrategy'

const debug = require('debug')('orm')

import BlockEntity from './BlockEntity'
export * from './BlockEntity'

import TxEntity from './TxEntity'
export * from './TxEntity'

import AccountTxEntity from './AccountTxEntity'
export * from './AccountTxEntity'

import NetworkEntity from './NetworkEntity'
export * from './NetworkEntity'

import RewardEntity from './RewardEntity'
export * from './RewardEntity'

import GeneralInfoEntity from './GeneralInfoEntity'
export * from './GeneralInfoEntity'

import BlockRewardEntity from './BlockRewardEntity'
export * from './BlockRewardEntity'

import DashboardEntity from './DashboardEntity'
export * from './DashboardEntity'

import PriceEntity from './PriceEntity'
export * from './PriceEntity'

export {
  BlockEntity,
  TxEntity,
  PriceEntity,
  AccountTxEntity,
  NetworkEntity,
  RewardEntity,
  GeneralInfoEntity,
  BlockRewardEntity,
  DashboardEntity
}

export const staticOptions = {
  supportBigNumbers: true,
  bigNumberStrings: true,
  entities: [
    BlockEntity,
    TxEntity,
    AccountTxEntity,
    NetworkEntity,
    RewardEntity,
    GeneralInfoEntity,
    BlockRewardEntity,
    DashboardEntity,
    PriceEntity
  ]
}

function initConnection(options: ConnectionOptions): Promise<Connection> {
  const pgOpts = options as PostgresConnectionOptions
  debug(`creating connection ${pgOpts.name || 'default'} to ${pgOpts.username}@${pgOpts.host}:${pgOpts.port || 5432}`)

  return createConnection({
    ...options,
    ...staticOptions,
    namingStrategy: new CamelToSnakeNamingStrategy()
  })
}

export async function init(): Promise<Connection[]> {
  const reader = new ConnectionOptionsReader()
  const options = (await reader.all()) as PostgresConnectionOptions[]

  if (options.length && !options.filter((o) => o.name === 'default').length) {
    options[0]['name' as any] = 'default'
  }

  const { TYPEORM_HOST, TYPEORM_HOST_RO, TYPEORM_USERNAME, TYPEORM_PASSWORD, TYPEORM_DATABASE } = process.env

  if (TYPEORM_HOST_RO) {
    const replicaOptions = options.map((option) => ({
      ...option,
      replication: {
        master: {
          host: TYPEORM_HOST,
          username: TYPEORM_USERNAME,
          password: TYPEORM_PASSWORD,
          database: TYPEORM_DATABASE
        },
        slaves: [
          {
            host: TYPEORM_HOST_RO,
            username: TYPEORM_USERNAME,
            password: TYPEORM_PASSWORD,
            database: TYPEORM_DATABASE
          }
        ]
      }
    }))

    return Bluebird.map(replicaOptions, initConnection)
  } else {
    return Bluebird.map(options, initConnection)
  }
}
