import { getAccount, getUnbondingDelegations } from 'lib/lcd'
import { getDelegations, DelegationInfo } from 'service/bank/getDelegations'

interface AccountDetails {
  account: any
  delegations?: DelegationInfo[]
  unbondings?: LcdStakingUnbonding[]
}

export async function getBalance(address: string): Promise<AccountDetails> {
  const [account, unbondings, delegations] = await Promise.all([
    getAccount(address),
    getUnbondingDelegations(address),
    getDelegations(address)
  ])

  return {
    account,
    delegations,
    unbondings
  }
}
