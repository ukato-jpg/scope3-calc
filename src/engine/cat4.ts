import type { Cat4Data, Cat4TonKiloEntry, Cat4FuelEntry, Cat4FuelEfficiencyEntry } from '@/types/categories'
import type { EmissionResult } from '@/types/common'
import type { IdeaRecord } from '@/types/idea'
import { kgToTon, errorResult, successResult } from './common'

/**
 * Cat.4: 輸送、配送（上流）— セクション1: トンキロ法
 * 排出量 = トンキロ × 排出原単位(kg-CO2eq/トンキロ) / 10^3
 */
export function calculateCat4TonKiloRow(
  entry: Cat4TonKiloEntry,
  lookupFn: (code: string) => IdeaRecord | undefined,
): EmissionResult {
  if (!entry.name) return successResult(entry.id, 0)

  const idea = lookupFn(entry.ideaProductCode)
  if (!idea) return errorResult(entry.id, 'IDEA排出原単位が見つかりません')

  const emission = kgToTon(entry.tonKilo * idea.emissionFactor)
  return successResult(entry.id, emission)
}

/**
 * Cat.4: セクション2: 燃料法
 * 排出量 = 換算後発熱量 × 排出原単位(kg-CO2eq/基準単位) / 10^3
 */
export function calculateCat4FuelRow(
  entry: Cat4FuelEntry,
  lookupFn: (code: string) => IdeaRecord | undefined,
): EmissionResult {
  if (!entry.name) return successResult(entry.id, 0)

  const idea = lookupFn(entry.ideaProductCode)
  if (!idea) return errorResult(entry.id, 'IDEA排出原単位が見つかりません')

  const amount = getEffectiveAmountFuel(entry, idea.unit)
  if (amount === null) return errorResult(entry.id, '単位換算を行う')

  return successResult(entry.id, kgToTon(amount * idea.emissionFactor))
}

/**
 * Cat.4: セクション3: 燃費法
 * 燃料使用量 = 距離 / 燃費 → 換算後発熱量 × 排出原単位(kg-CO2eq/基準単位) / 10^3
 */
export function calculateCat4FuelEfficiencyRow(
  entry: Cat4FuelEfficiencyEntry,
  lookupFn: (code: string) => IdeaRecord | undefined,
): EmissionResult {
  if (!entry.name) return successResult(entry.id, 0)

  const idea = lookupFn(entry.ideaProductCode)
  if (!idea) return errorResult(entry.id, 'IDEA排出原単位が見つかりません')

  const amount = entry.convertedAmount ?? entry.fuelUsage
  if (!amount) return errorResult(entry.id, '単位換算を行う')

  return successResult(entry.id, kgToTon(amount * idea.emissionFactor))
}

function getEffectiveAmountFuel(entry: Cat4FuelEntry, baseUnit: string): number | null {
  if (entry.unit === baseUnit) return entry.usage
  if (entry.convertedAmount !== null && entry.conversionUnit) {
    return entry.convertedAmount
  }
  return null
}

export function calculateCat4(
  data: Cat4Data,
  lookupFn: (code: string) => IdeaRecord | undefined,
): { tonKilo: EmissionResult[]; fuel: EmissionResult[]; fuelEfficiency: EmissionResult[] } {
  return {
    tonKilo: data.tonKilo.filter((e) => e.name).map((e) => calculateCat4TonKiloRow(e, lookupFn)),
    fuel: data.fuel.filter((e) => e.name).map((e) => calculateCat4FuelRow(e, lookupFn)),
    fuelEfficiency: data.fuelEfficiency.filter((e) => e.name).map((e) => calculateCat4FuelEfficiencyRow(e, lookupFn)),
  }
}
