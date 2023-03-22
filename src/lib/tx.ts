import config from '../config'
import * as crypto from 'crypto'
import { Tx } from '@terra-money/terra.js'
import { Tx as Tx_pb_legacy } from '@terra-money/terra.proto.legacy/cosmos/tx/v1beta1/tx'
import { Tx as Tx_pb } from '@terra-money/terra.proto/cosmos/tx/v1beta1/tx'

const tx_pb_actual = config.CHAIN_ID === 'columbus-5' ? Tx_pb_legacy : Tx_pb

export function isSuccessfulTx(tx: Transaction.LcdTransaction) {
  return tx.code ? false : true
}

export function getTxHash(txstring: string): string {
  const s256Buffer = crypto.createHash(`sha256`).update(Buffer.from(txstring, `base64`)).digest()
  const txbytes = new Uint8Array(s256Buffer)
  return Buffer.from(txbytes.slice(0, 32)).toString(`hex`).toUpperCase()
}

export function getTxHashesFromBlock(lcdBlock: LcdBlock): string[] {
  const txStrings = lcdBlock.block.data.txs

  if (!txStrings || !txStrings.length) {
    return []
  }

  const hashes = txStrings.map(getTxHash)
  return hashes
}

export function decodeTx(txBytes: string) {
  return Tx.fromProto(tx_pb_actual.decode(Buffer.from(txBytes, 'base64')))
}
