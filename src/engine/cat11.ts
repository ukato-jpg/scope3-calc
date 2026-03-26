import type { Cat11Data, Cat11EnergyEntry, Cat11FuelEntry, Cat11GhgEntry } from '@/types/categories'
import type { EmissionResult, GwpGeneration } from '@/types/common'
import type { IdeaRecord } from '@/types/idea'
import { kgToTon, errorResult, successResult } from './common'
import { lookupGwp } from './lookup'

/**
 * Cat.11: 販売した製品の使用 — セクション1: IDEA排出原単位
 * 排出量 = エネルギー消費量/台 × 販売台数 × 使用年数 × 排出原単位 / 10^3
 */
export function calculateCat11EnergyRow(
  entry: Cat11EnergyEntry,
  lookupFn: (code: string) => IdeaRecord | undefined,
): EmissionResult {
  if (!entry.name) return successResult(entry.id, 0)

  const idea = lookupFn(entry.ideaProductCode)
  if (!idea) return errorResult(entry.id, 'IDEA排出原単位が見つかりません')

  const totalConsumption = entry.consumptionPerUnit * entry.salesCount * entry.usageYears

  // 入力単位が基準単位と一致する場合
  if (entry.consumptionUnit === idea.unit) {
    return successResult(entry.id, kgToTon(totalConsumption * idea.emissionFactor))
  }

  // 換算後
  if (entry.convertedAmount !== null) {
    const totalConverted = entry.convertedAmount * entry.salesCount * entry.usageYears
    return successResult(entry.id, kgToTon(totalConverted * idea.emissionFactor))
  }

  return errorResult(entry.id, '単位換算を行う')
}

/**
 * Cat.11: セクション2: 燃料・フィードストック（独自排出原単位）
 * 排出量 = 換算後活動量 × 独自排出原単位 / 10^3
 */
export function calculateCat11FuelRow(entry: Cat11FuelEntry): EmissionResult {
  if (!entry.name) return successResult(entry.id, 0)

  if (!entry.customEmissionFactor) {
    return errorResult(entry.id, '独自排出原単位が未入力です')
  }

  const amount = entry.convertedAmount ?? entry.amount
  if (!amount) return errorResult(entry.id, '活動量が未入力です')

  return successResult(entry.id, kgToTon(amount * entry.customEmissionFactor))
}

/**
 * Cat.11: セクション3: GHG直接排出
 * 排出量 = (物質量 × 販売台数 × 比率/100) × GWP係数 / 10^3
 */
export function calculateCat11GhgRow(
  entry: Cat11GhgEntry,
  defaultGwpGeneration: GwpGeneration,
): EmissionResult {
  if (!entry.name) return successResult(entry.id, 0)

  const generation = entry.gwpGeneration || defaultGwpGeneration
  const gwp = lookupGwp(entry.gasName, generation)
  if (gwp === undefined) return errorResult(entry.id, 'GWP係数が見つかりません')

  const totalSubstance = entry.substanceAmount * entry.salesCount * (entry.ratio / 100)
  return successResult(entry.id, kgToTon(totalSubstance * gwp))
}

export function calculateCat11(
  data: Cat11Data,
  lookupFn: (code: string) => IdeaRecord | undefined,
  gwpGeneration: GwpGeneration,
): { energy: EmissionResult[]; fuel: EmissionResult[]; ghg: EmissionResult[] } {
  return {
    energy: data.energy.filter((e) => e.name).map((e) => calculateCat11EnergyRow(e, lookupFn)),
    fuel: data.fuel.filter((e) => e.name).map(calculateCat11FuelRow),
    ghg: data.ghg.filter((e) => e.name).map((e) => calculateCat11GhgRow(e, gwpGeneration)),
  }
}
