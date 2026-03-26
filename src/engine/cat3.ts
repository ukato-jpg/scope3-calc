import type { Cat3Entry } from '@/types/categories'
import type { EmissionResult } from '@/types/common'
import type { IdeaRecord } from '@/types/idea'
import { kgToTon, errorResult, successResult } from './common'

/**
 * Cat.3: Scope1,2に含まれない燃料及びエネルギー関連活動
 * 排出量 = 使用量 × 排出原単位(kg-CO2eq/基準単位) / 10^3
 */
export function calculateCat3Row(
  entry: Cat3Entry,
  lookupFn: (code: string) => IdeaRecord | undefined,
): EmissionResult {
  if (!entry.name && !entry.energyType) return successResult(entry.id, 0)
  if (!entry.usage) return successResult(entry.id, 0)

  const idea = lookupFn(entry.ideaProductCode)
  if (!idea) {
    return errorResult(entry.id, 'IDEA排出原単位が見つかりません')
  }
  if (entry.unit !== idea.unit) {
    return errorResult(entry.id, '単位が一致しません')
  }
  return successResult(entry.id, kgToTon(entry.usage * idea.emissionFactor))
}

export function calculateCat3(
  entries: Cat3Entry[],
  lookupFn: (code: string) => IdeaRecord | undefined,
): EmissionResult[] {
  return entries.filter((e) => e.name || e.energyType).map((e) => calculateCat3Row(e, lookupFn))
}
