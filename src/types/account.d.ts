interface BaseAccount {
  '@type': '/cosmos.vesting.v1beta1.BaseAccount'
  address: string
  pub_key: { '@type': string; key: string }
  account_number: string
  sequence: string
}

interface BaseVestingAccount {
  base_account: BaseAccount
  original_vesting: Coins
  delegated_free: Coins
  delegated_vesting: Coins
  end_time: string
}

interface ContinuousVestingAccount {
  '@type': '/cosmos.vesting.v1beta1.ContinuousVestingAccount'
  base_vesting_account: BaseVestingAccount
  start_time: string
}

interface DelayedVestingAccount {
  '@type': '/cosmos.vesting.v1beta1.DelayedVestingAccount'
  base_vesting_account: BaseVestingAccount
}

interface VestingPeriod {
  length: string // unit: seconds
  amount: Coins
}

interface PeriodicVestingAccount {
  '@type': '/cosmos.vesting.v1beta1.PeriodicVestingAccount'
  base_vesting_account: BaseVestingAccount
  start_time: string
  // linear vesting from start_time to period.length (seconds)
  vesting_periods: VestingPeriod[]
}

interface ModuleAccount {
  '@type': string // TODO: Find type
  name: string
  permissions: string[]
}

interface NormalizedAccount extends BaseAccount {
  // For vesting accounts
  original_vesting?: Coins
  delegated_free?: Coins
  delegated_vesting?: Coins
  end_time?: string
  start_time?: string
  vesting_periods?: VestingSchedules[]
  // For module accounts
  name?: string
  permissions?: string[]
}
