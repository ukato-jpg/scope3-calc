import type { Scope2Data, Scope2ElectricityEntry, Scope2HeatEntry } from '@/types/categories'
import type { EmissionResult } from '@/types/common'
import { kgToTon, successResult } from './common'

/**
 * Scope 2 電力: 排出量 = 電力使用量(kWh) × 排出係数(kg-CO2/kWh) / 1000
 */
export function calculateScope2ElectricityRow(entry: Scope2ElectricityEntry): EmissionResult {
  if (!entry.name && !entry.utility) return successResult(entry.id, 0)
  return successResult(entry.id, kgToTon(entry.usage * entry.emissionFactor))
}

/**
 * Scope 2 熱: 排出量 = 熱使用量(GJ) × 排出係数(kg-CO2/GJ) / 1000
 */
export function calculateScope2HeatRow(entry: Scope2HeatEntry): EmissionResult {
  if (!entry.name && !entry.heatType) return successResult(entry.id, 0)
  return successResult(entry.id, kgToTon(entry.usage * entry.emissionFactor))
}

export function calculateScope2(data: Scope2Data): {
  electricity: EmissionResult[]
  heat: EmissionResult[]
} {
  return {
    electricity: data.electricity.filter((e) => e.name || e.utility).map(calculateScope2ElectricityRow),
    heat: data.heat.filter((e) => e.name || e.heatType).map(calculateScope2HeatRow),
  }
}
