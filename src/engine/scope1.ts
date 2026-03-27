import type { Scope1Entry } from '@/types/categories'
import type { EmissionResult } from '@/types/common'
import { kgToTon, successResult } from './common'

/**
 * Scope 1: 燃料の燃焼による直接排出
 * 排出量 = 燃料使用量 × 排出係数(kg-CO2/単位) / 1000
 */
export function calculateScope1Row(entry: Scope1Entry): EmissionResult {
  if (!entry.name && !entry.fuelType) return successResult(entry.id, 0)
  return successResult(entry.id, kgToTon(entry.usage * entry.emissionFactor))
}

export function calculateScope1(entries: Scope1Entry[]): EmissionResult[] {
  return entries.filter((e) => e.name || e.fuelType).map(calculateScope1Row)
}
