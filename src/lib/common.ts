import { default as parseDuration } from 'parse-duration'
import { bech32 } from 'bech32'
import { orderBy } from 'lodash'

type Prefix = 'terra' | 'terrapub' | 'terravaloper' | 'terravaloperpub' | 'terravalcons' | 'terravalconspub'

export function convertAddress(prefix: Prefix, address: string): string {
  const { words } = bech32.decode(address)
  return bech32.encode(prefix, words)
}

export function convertAddressToHex(address: string): string {
  return Buffer.from(bech32.fromWords(bech32.decode(address).words)).toString('hex')
}

export function convertHexToAddress(prefix: Prefix, hexstring: string): string {
  return bech32.encode(prefix, bech32.toWords(Buffer.from(hexstring, 'hex')))
}

export function isNumeric(data: string): boolean {
  return !isNaN(Number(data))
}

const DENOM_ORDER = ['uluna']

export function sortDenoms<T>(coins: (T & { denom: string })[]): T[] {
  return orderBy<T & { denom: string }>(
    coins,
    [(coin): number => (DENOM_ORDER.includes(coin.denom) ? DENOM_ORDER.indexOf(coin.denom) : 999)],
    ['asc']
  )
}

const AMOUNT_DENOM_REGEXP = /[A-Z]{1,16}|[^A-Z]{1,64}/gi

export function splitDenomAndAmount(denomAndAmount: string): Coin {
  const [amount, denom] = denomAndAmount.match(AMOUNT_DENOM_REGEXP) || ['', '']
  return { amount, denom }
}

export function denomObjectToArray(denomObject: DenomTxVolumeObject, sliceCnt: number): DenomTxVolume[] {
  return sortDenoms(Object.keys(denomObject).map((denom) => ({ denom, data: denomObject[denom].slice(sliceCnt) })))
}
