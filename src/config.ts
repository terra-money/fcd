const {
  SERVER_PORT,
  LCD_URI,
  FCD_URI,
  RPC_URI,
  SENTRY_DSN,
  USE_LOG_FILE,
  DISABLE_API,
  EXCLUDED_ROUTES,
  MIN_GAS_PRICES,
  PRUNING_KEEP_EVERY,
  BANK_WALLETS,
  TOKEN_NETWORK,
  GENESIS_ACCOUNT_COUNT
} = process.env

const CHAIN_ID = process.env.CHAIN_ID || 'pisco-1'
const INITIAL_HEIGHT = parseInt(process.env.INITIAL_HEIGHT || '1')

const config = {
  ORM: 'default',
  CHAIN_ID,
  INITIAL_HEIGHT,
  SERVER_PORT: SERVER_PORT ? +SERVER_PORT : 3060,
  LCD_URI: LCD_URI || 'https://pisco-lcd.terra.dev',
  FCD_URI: FCD_URI || 'https://pisco-fcd.terra.dev',
  RPC_URI: RPC_URI || 'http://localhost:26657',
  BANK_WALLETS: BANK_WALLETS ? (JSON.parse(BANK_WALLETS) as string[]) : [],
  TOKEN_NETWORK: TOKEN_NETWORK,
  SENTRY_DSN,
  USE_LOG_FILE: !!JSON.parse(USE_LOG_FILE || 'false'),
  DISABLE_API: !!JSON.parse(DISABLE_API || 'false'),
  // Chain parameters
  EXCLUDED_ROUTES: EXCLUDED_ROUTES ? (JSON.parse(EXCLUDED_ROUTES) as string[]).map((regExp) => new RegExp(regExp)) : [],
  MIN_GAS_PRICES: MIN_GAS_PRICES
    ? (JSON.parse(MIN_GAS_PRICES) as DenomMap)
    : ({
        uluna: '5.0'
      } as DenomMap),
  PRUNING_KEEP_EVERY: parseInt(PRUNING_KEEP_EVERY || '100', 10) || 100,
  GENESIS_ACCOUNT_COUNT: parseInt(GENESIS_ACCOUNT_COUNT || '0', 10) || 0
}

export default config
