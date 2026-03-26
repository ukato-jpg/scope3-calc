import type { Cat15Entry } from '@/types/categories'
import type { EmissionResult } from '@/types/common'
import { successResult } from './common'

/**
 * Cat.15: 投資
 * 排出量 = 投資先Scope1,2排出量(t-CO2eq) × 持分比率(%) / 100
 */
export function calculateCat15Row(entry: Cat15Entry): EmissionResult {
  const emission = entry.investeeEmission * entry.equityShare / 100
  return successResult(entry.id, emission)
}

export function calculateCat15(entries: Cat15Entry[]): EmissionResult[] {
  return entries.filter((e) => e.name).map(calculateCat15Row)
}
