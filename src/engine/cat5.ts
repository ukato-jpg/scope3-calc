import type { Cat5Entry } from '@/types/categories'
import type { EmissionResult } from '@/types/common'
import type { IdeaRecord } from '@/types/idea'
import { kgToTon, errorResult, successResult } from './common'

/**
 * Cat.5: 事業から出る廃棄物
 * 廃棄物処理排出量 = 処理量(t) × 1000 × 排出原単位(kg-CO2eq/kg) / 10^3
 *                   = 処理量(t) × 排出原単位
 * 輸送排出量 = トンキロ × 輸送排出原単位(kg-CO2eq/トンキロ) / 10^3
 * 合計 = 廃棄物処理排出量 + 輸送排出量
 */
export function calculateCat5Row(
  entry: Cat5Entry,
  lookupFn: (code: string) => IdeaRecord | undefined,
): EmissionResult {
  if (!entry.name) return successResult(entry.id, 0)

  let treatmentEmission = 0
  let transportEmission = 0

  // 廃棄物処理
  if (entry.treatmentIdeaProductCode) {
    const idea = lookupFn(entry.treatmentIdeaProductCode)
    if (!idea) return errorResult(entry.id, '廃棄物処理のIDEA排出原単位が見つかりません')
    // 処理量(t) * 1000(kg/t) * 原単位(kg-CO2eq/kg) / 1000(t変換)
    treatmentEmission = entry.wasteAmount * 1000 * idea.emissionFactor / 1000
  }

  // 輸送（任意）
  if (entry.transportIdeaProductCode && entry.tonKilo) {
    const ideaTransport = lookupFn(entry.transportIdeaProductCode)
    if (!ideaTransport) return errorResult(entry.id, '輸送のIDEA排出原単位が見つかりません')
    transportEmission = kgToTon(entry.tonKilo * ideaTransport.emissionFactor)
  }

  return successResult(entry.id, treatmentEmission + transportEmission)
}

export function calculateCat5(
  entries: Cat5Entry[],
  lookupFn: (code: string) => IdeaRecord | undefined,
): EmissionResult[] {
  return entries.filter((e) => e.name).map((e) => calculateCat5Row(e, lookupFn))
}
