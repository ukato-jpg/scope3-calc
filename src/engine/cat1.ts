import type { Cat1Entry } from '@/types/categories'
import type { EmissionResult } from '@/types/common'
import { kgToTon, errorResult, successResult } from './common'

/**
 * Cat.1: 購入した製品・サービス
 * IDEA排出量 = 活動量 × IDEA排出原単位(kg-CO2eq/基準単位) / 10^3
 * 独自排出量 = 活動量 × 独自排出原単位(kg-CO2eq/基準単位) / 10^3
 * 排出量 = 独自排出原単位がある場合は独自、なければIDEA
 */
export function calculateCat1Row(entry: Cat1Entry): EmissionResult {
  if (!entry.name) return successResult(entry.id, 0)

  if (entry.factorSource === 'custom') {
    if (!entry.customEmissionFactor) {
      return errorResult(entry.id, '独自排出原単位が未入力です')
    }
    const amount = getEffectiveAmount(entry, entry.customBaseUnit)
    if (amount === null) return errorResult(entry.id, '単位換算を行う')
    return successResult(entry.id, kgToTon(amount * entry.customEmissionFactor))
  }

  // IDEA排出原単位を使用
  if (!entry.ideaEmissionFactor) {
    return errorResult(entry.id, 'IDEA排出原単位が未設定です')
  }
  const amount = getEffectiveAmount(entry, entry.ideaBaseUnit)
  if (amount === null) return errorResult(entry.id, '単位換算を行う')
  return successResult(entry.id, kgToTon(amount * entry.ideaEmissionFactor))
}

/** 入力単位と基準単位の一致チェック + 換算後活動量の取得 */
function getEffectiveAmount(entry: Cat1Entry, baseUnit: string): number | null {
  if (entry.unit === baseUnit) return entry.activityAmount
  if (entry.convertedUnit === baseUnit && entry.convertedAmount !== null) {
    return entry.convertedAmount
  }
  return null
}

export function calculateCat1(entries: Cat1Entry[]): EmissionResult[] {
  return entries.filter((e) => e.name).map(calculateCat1Row)
}
