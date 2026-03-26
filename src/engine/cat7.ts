import type { Cat7Data, Cat7TransportEntry, Cat7CommutingEntry } from '@/types/categories'
import type { EmissionResult } from '@/types/common'
import { kgToTon, errorResult, successResult } from './common'
import { lookupTransportFactor, lookupCommutingFactor } from './lookup'

/**
 * Cat.7: 雇用者の通勤 — セクション1: 交通費支給額
 * 排出量 = 交通費(円) × 排出原単位(kgCO2/円) / 10^3
 */
export function calculateCat7TransportRow(entry: Cat7TransportEntry): EmissionResult {
  if (!entry.name) return successResult(entry.id, 0)

  const factor = lookupTransportFactor(entry.transportType)
  if (factor === undefined) return errorResult(entry.id, '交通区分が見つかりません')

  return successResult(entry.id, kgToTon(entry.amount * factor))
}

/**
 * Cat.7: セクション2: 従業員数・営業日数
 * 排出量 = 従業員数 × 営業日数 × 排出原単位(kgCO2/人・日) / 10^3
 */
export function calculateCat7CommutingRow(entry: Cat7CommutingEntry): EmissionResult {
  if (!entry.name) return successResult(entry.id, 0)

  const factor = lookupCommutingFactor(entry.workStyleCity)
  if (factor === undefined) return errorResult(entry.id, '勤務形態-都市区分が見つかりません')

  return successResult(entry.id, kgToTon(entry.employeeCount * entry.workDays * factor))
}

export function calculateCat7(data: Cat7Data): {
  transport: EmissionResult[]
  commuting: EmissionResult[]
} {
  return {
    transport: data.transport.filter((e) => e.name).map(calculateCat7TransportRow),
    commuting: data.commuting.filter((e) => e.name).map(calculateCat7CommutingRow),
  }
}
