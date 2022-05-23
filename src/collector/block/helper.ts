import { WhereExpressionBuilder, getRepository } from 'typeorm'
import { PriceEntity } from 'orm'
import { getDateRangeOfLastMinute, getQueryDateTime } from 'lib/time'

export function addDatetimeFilterToQuery(timestamp: number, qb: WhereExpressionBuilder) {
  const { from, to } = getDateRangeOfLastMinute(timestamp)

  qb.andWhere(`timestamp >= '${getQueryDateTime(from)}'`)
  qb.andWhere(`timestamp < '${getQueryDateTime(to)}'`)
}

export async function getAllActivePrices(timestamp: number): Promise<{ [denom: string]: string }> {
  // TODO: Need to fix the query because of exact time matching might fail
  const prices = await getRepository(PriceEntity).find({
    datetime: new Date(timestamp)
  })

  return prices.reduce((acc, price) => {
    return { ...acc, [price.denom]: price['price'] }
  }, {})
}
