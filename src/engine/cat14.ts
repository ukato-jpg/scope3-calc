import type { Cat14Entry } from '@/types/categories'
import type { EmissionResult } from '@/types/common'
import type { IdeaRecord } from '@/types/idea'
import { kgToTon, errorResult, successResult } from './common'

/**
 * Cat.14: フランチャイズ
 * 排出量 = エネルギー消費量 × 排出原単位(kg-CO2eq/基準単位) / 10^3
 * Cat.8と類似だがリース個数の概念がない
 */
export function calculateCat14Row(
  entry: Cat14Entry,
  lookupFn: (code: string) => IdeaRecord | undefined,
): EmissionResult {
  if (!entry.name) return successResult(entry.id, 0)

  const idea = lookupFn(entry.ideaProductCode)
  if (!idea) return errorResult(entry.id, 'IDEA排出原単位が見つかりません')

  // 入力単位が基準単位と一致する場合
  if (entry.consumptionUnit === idea.unit) {
    return successResult(entry.id, kgToTon(entry.consumption * idea.emissionFactor))
  }

  // 換算後
  if (entry.convertedAmount !== null) {
    return successResult(entry.id, kgToTon(entry.convertedAmount * idea.emissionFactor))
  }

  return errorResult(entry.id, '単位換算を行う')
}

export function calculateCat14(
  entries: Cat14Entry[],
  lookupFn: (code: string) => IdeaRecord | undefined,
): EmissionResult[] {
  return entries.filter((e) => e.name).map((e) => calculateCat14Row(e, lookupFn))
}
