import { request, Agent } from 'undici'
import config from 'config'
import { ErrorTypes, APIError } from './error'

const agent = new Agent({
  connect: {
    rejectUnauthorized: false
  }
})

const NOT_FOUND_REGEX = /(?:not found|no del|not ex|failed to find|unknown prop|empty bytes|No price reg)/i

async function get(path: string, params?: Record<string, unknown>): Promise<any> {
  const options = {
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': 'terra-fcd'
    },
    dispatcher: agent
  }

  let url = `${config.LCD_URI}${path}`
  params && Object.keys(params).forEach((key) => params[key] === undefined && delete params[key])
  const qs = new URLSearchParams(params as any).toString()
  if (qs.length) {
    url += `?${qs}`
  }

  const res = await request(url, options).then(async (res) => {
    const json = await res.body.json()

    if (res.statusCode === 404 && json.message && NOT_FOUND_REGEX.test(json.message)) {
      return undefined
    }

    if (res.statusCode === 400) {
      throw new APIError(ErrorTypes.INVALID_REQUEST_ERROR, undefined, url)
    }

    if (res.statusCode !== 200) {
      throw new APIError(ErrorTypes.LCD_ERROR, `${res.statusCode}`, `${url} ${json.message}`, json)
    }

    return json
  })

  if (res?.height && res.result !== undefined) {
    return res.result
  }

  return res
}

// NOTE: height parameter depends on node's configuration
// The default is: PruneDefault defines a pruning strategy where the last 100 heights are kept
// in addition to every 100th and where to-be pruned heights are pruned at every 10th height.
function calculateHeightParam(strHeight?: string): string | undefined {
  const numHeight = Number(strHeight)

  if (!numHeight) {
    return undefined
  }

  if (
    latestHeight &&
    (latestHeight < config.INITIAL_HEIGHT + config.PRUNING_KEEP_EVERY || // Pruning not happened yet
      latestHeight - numHeight < config.PRUNING_KEEP_EVERY) // Last 100 heights are guarenteed
  ) {
    return strHeight
  }

  return Math.max(
    config.INITIAL_HEIGHT,
    numHeight + (config.PRUNING_KEEP_EVERY - (numHeight % config.PRUNING_KEEP_EVERY))
  ).toString()
}

///////////////////////////////////////////////
// Transactions
///////////////////////////////////////////////
export async function getTx(hash: string): Promise<Transaction.LcdTransaction> {
  const res = await get(`/cosmos/tx/v1beta1/txs/${hash}`)

  if (!res || !res.tx_response) {
    throw new APIError(ErrorTypes.NOT_FOUND_ERROR, '', `transaction not found on node (hash: ${hash})`)
  }

  return res.tx_response
}

///////////////////////////////////////////////
// Tendermint RPC
///////////////////////////////////////////////
export async function getValidatorConsensus(strHeight?: string): Promise<LcdValidatorConsensus[]> {
  const height = calculateHeightParam(strHeight)
  const {
    validators,
    pagination
  }: {
    validators: LcdValidatorConsensus[]
    pagination: Pagination
  } = await get(`/cosmos/base/tendermint/v1beta1/validatorsets/${height || 'latest'}`)

  const result = [validators]
  let total = parseInt(pagination.total) - 100
  let offset = 100

  while (total > 0) {
    const {
      validators
    }: {
      validators: LcdValidatorConsensus[]
    } = await get(`/cosmos/base/tendermint/v1beta1/validatorsets/${height || 'latest'}`, {
      'pagination.offset': offset
    })

    result.push(validators)
    offset += 100
    total -= 100
  }

  return result.flat()
}

// ExtendedValidator includes all LcdValidator, VotingPower and Uptime
export interface ExtendedValidator {
  lcdValidator: LcdValidator
  lcdConsensus?: LcdValidatorConsensus
}

export async function getValidatorsAndConsensus(
  status?: LcdValidatorStatus,
  strHeight?: string
): Promise<ExtendedValidator[]> {
  const [validators, validatorConsensus] = await Promise.all([
    getValidators(status, strHeight),
    getValidatorConsensus(strHeight)
  ])
  // const totalVotingPower = validatorConsensus.reduce((acc, consVal) => plus(acc, consVal.voting_power), '0')

  return validators.reduce<ExtendedValidator[]>((prev, lcdValidator) => {
    const lcdConsensus = validatorConsensus.find((consVal) => consVal.pub_key.key === lcdValidator.consensus_pubkey.key)

    prev.push({
      lcdValidator,
      lcdConsensus
      // votingPower: consVal ? times(consVal.voting_power, 1000000) : '0.0',
      // votingPowerWeight: consVal ? div(consVal.voting_power, totalVotingPower) : '0.0'
    })

    return prev
  }, [])
}

export function getBlock(height: string): Promise<LcdBlock> {
  return get(`/cosmos/base/tendermint/v1beta1/blocks/${height}`)
}

// Store latestHeight for later use
let latestHeight = 0

export function getLatestBlock(): Promise<LcdBlock> {
  return get(`/cosmos/base/tendermint/v1beta1/blocks/latest`).then((latestBlock) => {
    if (latestBlock?.block) {
      latestHeight = Number(latestBlock.block.header.height)
    }

    return latestBlock
  })
}

///////////////////////////////////////////////
// Auth & Bank
///////////////////////////////////////////////
export async function getAccount(address: string): Promise<{ account: any; balances: Coin[] }> {
  const results = await Promise.all([
    get(`/cosmos/auth/v1beta1/accounts/${address}`),
    get(`/cosmos/bank/v1beta1/balances/${address}`)
  ])

  return {
    ...results[0],
    ...results[1]
  }
}

export async function getTotalSupply(strHeight?: string): Promise<Coin[]> {
  return (await get('/cosmos/bank/v1beta1/supply', { height: calculateHeightParam(strHeight) })).supply || []
}

///////////////////////////////////////////////
// Staking
///////////////////////////////////////////////
export async function getDelegations(delegator: string): Promise<LcdStakingDelegation[]> {
  const res = await get(`/cosmos/staking/v1beta1/delegations/${delegator}`)
  return res?.delegation_responses || []
}

export async function getUnbondingDelegations(address: string): Promise<LcdStakingUnbonding[]> {
  const res = await get(`/cosmos/staking/v1beta1/delegators/${address}/unbonding_delegations`)
  return res?.unbonding_responses || []
}

export async function getValidators(status?: LcdValidatorStatus, strHeight?: string): Promise<LcdValidator[]> {
  const height = calculateHeightParam(strHeight)

  if (status) {
    return (await get(`/cosmos/staking/v1beta1/validators`, { status, height, 'pagination.limit': 200 })).validators
  }

  const url = `/cosmos/staking/v1beta1/validators`

  const [bonded, unbonded, unbonding] = await Promise.all([
    get(url, { status: 'BOND_STATUS_BONDED', height, 'pagination.limit': 200 }),
    get(url, { status: 'BOND_STATUS_UNBONDING', height }),
    get(url, { status: 'BOND_STATUS_UNBONDED', height })
  ])

  return [bonded.validators, unbonded.validators, unbonding.validators].flat()
}

export async function getValidator(operatorAddr: string): Promise<LcdValidator | undefined> {
  const res = await get(`/cosmos/staking/v1beta1/validators/${operatorAddr}`)
  return res?.validator
}

export async function getStakingPool(strHeight?: string): Promise<LcdStakingPool> {
  return (await get(`/cosmos/staking/v1beta1/pool`, { height: calculateHeightParam(strHeight) })).pool
}

///////////////////////////////////////////////
// Distribution
///////////////////////////////////////////////
export async function getCommunityPool(strHeight?: string): Promise<Coin[] | null> {
  return (await get(`/cosmos/distribution/v1beta1/community_pool`, { height: calculateHeightParam(strHeight) })).pool
}

export async function getAllActiveIssuance(strHeight?: string): Promise<{ [denom: string]: string }> {
  return (await getTotalSupply(strHeight)).reduce((acc, item) => {
    acc[item.denom] = item.amount
    return acc
  }, {})
}

export async function getContractStore(
  contractAddress: string,
  data: Object,
  strHeight?: string
): Promise<Record<string, unknown>> {
  const base64 = Buffer.from(JSON.stringify(data), 'base64').toString()

  return get(`/cosmwasm/wasm/v1/contract/${contractAddress}/smart/${base64}}`, {
    height: calculateHeightParam(strHeight)
  })
}
