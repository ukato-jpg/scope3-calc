import type { Cat12Entry } from '@/types/categories'
import type { EmissionResult } from '@/types/common'
import type { IdeaRecord } from '@/types/idea'
import { errorResult, successResult } from './common'

/**
 * Cat.12: 販売した製品の廃棄
 * 排出量 = 処理量(t) × 1000 × 排出原単位(kg-CO2eq/kg) / 10^3
 *        = 処理量(t) × 排出原単位
 */
export function calculateCat12Row(
  entry: Cat12Entry,
  lookupFn: (code: string) => IdeaRecord | undefined,
): EmissionResult {
  if (!entry.name) return successResult(entry.id, 0)

  const idea = lookupFn(entry.ideaProductCode)
  if (!idea) return errorResult(entry.id, 'IDEA排出原単位が見つかりません')

  // t * 1000(kg/t) * factor(kg-CO2eq/kg) / 1000(t変換) = t * factor
  const emission = entry.wasteAmount * 1000 * idea.emissionFactor / 1000
  return successResult(entry.id, emission)
}

export function calculateCat12(
  entries: Cat12Entry[],
  lookupFn: (code: string) => IdeaRecord | undefined,
): EmissionResult[] {
  return entries.filter((e) => e.name).map((e) => calculateCat12Row(e, lookupFn))
}
