import type { Cat2Entry } from '@/types/categories'
import type { EmissionResult } from '@/types/common'
import { errorResult, successResult } from './common'
import { lookupCapitalGoods } from './lookup'

/**
 * Cat.2: 資本財
 * 排出量 = 資産額(百万円) × 排出原単位(tCO2eq/百万円)
 */
export function calculateCat2Row(entry: Cat2Entry): EmissionResult {
  if (!entry.name) return successResult(entry.id, 0)

  const record = lookupCapitalGoods(entry.capitalGoodsCode)
  if (!record) {
    return errorResult(entry.id, '資本財コードが見つかりません')
  }
  const emission = entry.assetAmount * record.emissionFactor
  return successResult(entry.id, emission)
}

export function calculateCat2(entries: Cat2Entry[]): EmissionResult[] {
  return entries.filter((e) => e.name).map(calculateCat2Row)
}
