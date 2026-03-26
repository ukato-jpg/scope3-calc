import type { Cat6Data, Cat6TransportEntry, Cat6AccommodationEntry, Cat6EmployeeEntry } from '@/types/categories'
import type { EmissionResult } from '@/types/common'
import { kgToTon, errorResult, successResult } from './common'
import { lookupTransportFactor, getPerNightFactor, getPerEmployeeFactor } from './lookup'

/**
 * Cat.6: 出張 — セクション1-1: 交通費支給額
 * 排出量 = 交通費(円) × 排出原単位(kgCO2/円) / 10^3
 */
export function calculateCat6TransportRow(entry: Cat6TransportEntry): EmissionResult {
  if (!entry.name) return successResult(entry.id, 0)

  const factor = lookupTransportFactor(entry.transportType)
  if (factor === undefined) return errorResult(entry.id, '交通区分が見つかりません')

  return successResult(entry.id, kgToTon(entry.amount * factor))
}

/**
 * Cat.6: セクション1-2: 宿泊日数
 * 排出量 = 宿泊数(泊) × 排出原単位(kgCO2/泊) / 10^3
 */
export function calculateCat6AccommodationRow(entry: Cat6AccommodationEntry): EmissionResult {
  if (!entry.name) return successResult(entry.id, 0)
  return successResult(entry.id, kgToTon(entry.nights * getPerNightFactor()))
}

/**
 * Cat.6: セクション2: 従業員数
 * 排出量 = 従業員数(人) × 排出原単位(tCO2/人・年)
 * ※10^3除算なし（原単位がtCO2単位のため）
 */
export function calculateCat6EmployeeRow(entry: Cat6EmployeeEntry): EmissionResult {
  if (!entry.name) return successResult(entry.id, 0)
  return successResult(entry.id, entry.employeeCount * getPerEmployeeFactor())
}

export function calculateCat6(data: Cat6Data): {
  transport: EmissionResult[]
  accommodation: EmissionResult[]
  employee: EmissionResult[]
} {
  return {
    transport: data.transport.filter((e) => e.name).map(calculateCat6TransportRow),
    accommodation: data.accommodation.filter((e) => e.name).map(calculateCat6AccommodationRow),
    employee: data.employee.filter((e) => e.name).map(calculateCat6EmployeeRow),
  }
}
