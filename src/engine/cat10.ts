import type { Cat10Entry } from '@/types/categories'
import type { EmissionResult } from '@/types/common'
import type { IdeaRecord } from '@/types/idea'
import { kgToTon, errorResult, successResult } from './common'

/**
 * Cat.10: 販売した製品の加工
 * 排出量 = 販売数量 × 排出原単位(kg-CO2eq/基準単位) / 10^3
 */
export function calculateCat10Row(
  entry: Cat10Entry,
  lookupFn: (code: string) => IdeaRecord | undefined,
): EmissionResult {
  if (!entry.name) return successResult(entry.id, 0)

  const idea = lookupFn(entry.ideaProductCode)
  if (!idea) return errorResult(entry.id, 'IDEA排出原単位が見つかりません')

  if (entry.salesUnit !== idea.unit) {
    return errorResult(entry.id, '販売数単位を見直し')
  }

  return successResult(entry.id, kgToTon(entry.salesQuantity * idea.emissionFactor))
}

export function calculateCat10(
  entries: Cat10Entry[],
  lookupFn: (code: string) => IdeaRecord | undefined,
): EmissionResult[] {
  return entries.filter((e) => e.name).map((e) => calculateCat10Row(e, lookupFn))
}
