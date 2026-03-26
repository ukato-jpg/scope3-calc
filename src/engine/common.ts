import type { EmissionResult } from '@/types/common'

/** kg-CO2eq → t-CO2eq への変換 (÷1000) */
export function kgToTon(kgCO2eq: number): number {
  return kgCO2eq / 1000
}

/** エラー結果を返す */
export function errorResult(rowId: string, error: string): EmissionResult {
  return { rowId, emission_tCO2eq: 0, error }
}

/** 正常結果を返す */
export function successResult(rowId: string, emission_tCO2eq: number): EmissionResult {
  return { rowId, emission_tCO2eq }
}

/** 排出量合計を計算 */
export function sumEmissions(results: EmissionResult[]): number {
  return results.reduce((sum, r) => sum + r.emission_tCO2eq, 0)
}

/** エラー件数をカウント */
export function countErrors(results: EmissionResult[]): number {
  return results.filter((r) => r.error).length
}
