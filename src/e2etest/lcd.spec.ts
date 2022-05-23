import 'jest-extended'
import * as lcd from 'lib/lcd'

const UNKNOWN_TX_HASH = '0C7A5F320FD3B91CEC2BEBDF539E8B71E1C120B04F95DEF6FB09EEBF9552391B'
const VALID_TX_HASH = 'ED3EA0E1AA684546B8FC1CA57625688876A6DD7C9DF283FCAE271128C52A5D14'

const UNKNOWN_TERRA_ADDRESS = 'terra12c5s58hnc3c0pjr5x7u68upsgzg2r8fwq5nlsy'
const VALID_TERRA_ADDRESS = 'terra1dcegyrekltswvyy0xy69ydgxn9x8x32zdtapd8'

const UNKNOWN_VALOPER_ADDRESS = 'terravaloper1uwgg244kechjgqdyr9kyxtt7yyj5zqcugvna2d'
const VALID_VALOPER_ADDRESS = 'terravaloper1dcegyrekltswvyy0xy69ydgxn9x8x32zdy3ua5'
const VALID_VALTERRA_ADDRESS = 'terra1dcegyrekltswvyy0xy69ydgxn9x8x32zdtapd8'
// const VALID_VALCONSPUB_ADDRESS = 'terravalconspub1zcjduepqwgwyky5375uk0llhwf0ya5lmwy4up838jevfh3pyzf5s3hd96xjslnexul'

const coinObject = {
  denom: expect.any(String),
  amount: expect.any(String)
}

const validatorObject = {
  commission: {
    commission_rates: {
      max_change_rate: expect.any(String),
      max_rate: expect.any(String),
      rate: expect.any(String)
    },
    update_time: expect.any(String)
  },
  consensus_pubkey: {
    '@type': expect.any(String),
    key: expect.any(String)
  },
  delegator_shares: expect.any(String),
  description: {
    details: expect.any(String),
    identity: expect.any(String),
    moniker: expect.any(String),
    website: expect.any(String)
  },
  jailed: expect.any(Boolean),
  min_self_delegation: expect.any(String),
  operator_address: expect.any(String),
  status: expect.any(String),
  tokens: expect.any(String),
  unbonding_height: expect.any(String),
  unbonding_time: expect.any(String)
}

describe('LCD', () => {
  test('getBlock: invalid', async () => {
    await expect(lcd.getBlock('0')).toReject()
  })

  test('getBlock: not found', async () => {
    await expect(lcd.getBlock(Number.MAX_SAFE_INTEGER.toString())).toReject()
  })

  test('getBlock: success', async () => {
    await expect(lcd.getBlock('7599304')).resolves.toMatchObject({
      block: {}
    })
  })

  test('getLatestBlock', async () => {
    await expect(lcd.getLatestBlock()).resolves.toMatchObject({
      block: {}
    })
  })

  test('getTx: invalid', async () => {
    await expect(lcd.getTx('blahblah')).toReject()
  })

  test('getTx: not found', async () => {
    await expect(lcd.getTx(UNKNOWN_TX_HASH)).toReject()
  })

  test('getTx: success', async () => {
    await expect(lcd.getTx(VALID_TX_HASH)).resolves.toMatchObject({
      txhash: VALID_TX_HASH
    })
  })

  test('getValidatorConsensus', async () => {
    await expect(lcd.getValidatorConsensus()).resolves.toContainEqual({
      address: expect.any(String),
      pub_key: {
        '@type': expect.any(String),
        key: expect.any(String)
      },
      proposer_priority: expect.any(String),
      voting_power: expect.any(String)
    })
  })

  test('getAccount: invalid', async () => {
    await expect(lcd.getAccount('1234')).toReject()
  })

  test('getAccount: not found', async () => {
    await expect(lcd.getAccount(UNKNOWN_TERRA_ADDRESS)).resolves.toMatchObject({
      balances: []
    })
  })

  test('getAccount: success', async () => {
    await expect(lcd.getAccount(VALID_VALTERRA_ADDRESS)).resolves.toMatchObject({
      account: {
        address: VALID_VALTERRA_ADDRESS
      },
      balances: expect.arrayContaining([coinObject])
    })
  })

  test('getDelegations: invalid', async () => {
    await expect(lcd.getDelegations('invalid')).toReject()
  })

  test('getDelegations: not found', async () => {
    await expect(lcd.getDelegations(UNKNOWN_TERRA_ADDRESS)).resolves.toBeArrayOfSize(0)
  })

  test('getDelegations: success', async () => {
    const delegations = await lcd.getDelegations(VALID_TERRA_ADDRESS)

    expect(delegations).toBeArray()

    const delegation = delegations.find((d) => d.delegation.delegator_address === VALID_TERRA_ADDRESS)

    expect(delegation).toMatchObject({
      balance: coinObject,
      delegation: {
        delegator_address: expect.any(String),
        shares: expect.any(String),
        validator_address: expect.any(String)
      }
    })
  })

  test('getUnbondingDelegations: invalid', async () => {
    await expect(lcd.getUnbondingDelegations('invalid')).toReject()
  })

  test('getUnbondingDelegations: not found', async () => {
    await expect(lcd.getUnbondingDelegations(VALID_TERRA_ADDRESS)).resolves.toBeArrayOfSize(0)
  })

  test('getUnbondingDelegations: pass', async () => {
    // TODO: Figure out how to test getUnbondingDelegation
  })

  test('getValidators', async () => {
    await expect(lcd.getValidators()).resolves.toBeInstanceOf(Array)
  })

  test('getValidators by status', async () => {
    await expect(lcd.getValidators('BOND_STATUS_BONDED')).resolves.not.toBeArrayOfSize(0)
  })

  test('getValidator: invalid', async () => {
    await expect(lcd.getValidator('invalid')).toReject()
  })

  test('getValidator: not found', async () => {
    await expect(lcd.getValidator(UNKNOWN_VALOPER_ADDRESS)).resolves.toBeUndefined()
  })

  test('getValidator: success', async () => {
    await expect(lcd.getValidator(VALID_VALOPER_ADDRESS)).resolves.toMatchObject(validatorObject)
  })

  test('getStakingPool', async () => {
    await expect(lcd.getStakingPool()).resolves.toMatchObject({
      not_bonded_tokens: expect.any(String),
      bonded_tokens: expect.any(String)
    })
  })

  test('getTotalSupply', async () => {
    await expect(lcd.getTotalSupply()).resolves.toContainEqual(coinObject)
  })

  test('getAllActiveIssuance', async () => {
    await expect(lcd.getAllActiveIssuance()).resolves.toMatchObject({
      uluna: expect.any(String)
    })
  })
})
