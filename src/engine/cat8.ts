import type { Cat8Entry } from '@/types/categories'
import type { EmissionResult } from '@/types/common'
import type { IdeaRecord } from '@/types/idea'
import { kgToTon, errorResult, successResult } from './common'

/**
 * Cat.8: リース資産（上流）/ Cat.13: リース資産（下流）共通
 * 総使用量 = 使用量/台 × リース数
 * 排出量 = 有効活動量 × 排出原単位(kg-CO2eq/基準単位) / 10^3
 */
export function calculateCat8Row(
  entry: Cat8Entry,
  lookupFn: (code: string) => IdeaRecord | undefined,
): EmissionResult {
  if (!entry.name) return successResult(entry.id, 0)

  const idea = lookupFn(entry.ideaProductCode)
  if (!idea) return errorResult(entry.id, 'IDEA排出原単位が見つかりません')

  // 入力単位が基準単位と一致する場合
  if (entry.usageUnit === idea.unit) {
    return successResult(entry.id, kgToTon(entry.totalUsage * idea.emissionFactor))
  }

  // 換算後単位が基準単位と一致する場合
  if (entry.convertedAmount !== null) {
    return successResult(entry.id, kgToTon(entry.convertedAmount * idea.emissionFactor))
  }

  return errorResult(entry.id, '単位換算を行う')
}

export function calculateCat8(
  entries: Cat8Entry[],
  lookupFn: (code: string) => IdeaRecord | undefined,
): EmissionResult[] {
  return entries.filter((e) => e.name).map((e) => calculateCat8Row(e, lookupFn))
}
