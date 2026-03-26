import type { AllCategoryData } from '@/types/categories'
import type { EmissionResult, GwpGeneration } from '@/types/common'
import type { IdeaRecord } from '@/types/idea'
import { sumEmissions, countErrors } from './common'
import { calculateCat1 } from './cat1'
import { calculateCat2 } from './cat2'
import { calculateCat3 } from './cat3'
import { calculateCat4 } from './cat4'
import { calculateCat5 } from './cat5'
import { calculateCat6 } from './cat6'
import { calculateCat7 } from './cat7'
import { calculateCat8 } from './cat8'
import { calculateCat10 } from './cat10'
import { calculateCat11 } from './cat11'
import { calculateCat12 } from './cat12'
import { calculateCat14 } from './cat14'
import { calculateCat15 } from './cat15'

export type CategorySummary = {
  categoryId: number
  categoryName: string
  emission: number
  errorCount: number
  results: EmissionResult[]
}

export type Scope3Summary = {
  categories: CategorySummary[]
  scope3Total: number
  scope1: number
  scope2: number
  grandTotal: number
}

/** 全カテゴリの排出量を集計 */
export function aggregateAll(
  data: AllCategoryData,
  lookupFn: (code: string) => IdeaRecord | undefined,
  gwpGeneration: GwpGeneration,
  scope1: number,
  scope2: number,
): Scope3Summary {
  // Cat.1
  const cat1Results = calculateCat1(data.cat1)
  // Cat.2
  const cat2Results = calculateCat2(data.cat2)
  // Cat.3
  const cat3Results = calculateCat3(data.cat3, lookupFn)
  // Cat.4 (3セクション)
  const cat4Sections = calculateCat4(data.cat4, lookupFn)
  const cat4Results = [...cat4Sections.tonKilo, ...cat4Sections.fuel, ...cat4Sections.fuelEfficiency]
  // Cat.5
  const cat5Results = calculateCat5(data.cat5, lookupFn)
  // Cat.6 (3セクション)
  const cat6Sections = calculateCat6(data.cat6)
  const cat6Results = [...cat6Sections.transport, ...cat6Sections.accommodation, ...cat6Sections.employee]
  // Cat.7 (2セクション)
  const cat7Sections = calculateCat7(data.cat7)
  const cat7Results = [...cat7Sections.transport, ...cat7Sections.commuting]
  // Cat.8
  const cat8Results = calculateCat8(data.cat8, lookupFn)
  // Cat.9 (Cat.4と同じ構造)
  const cat9Sections = calculateCat4(data.cat9, lookupFn)
  const cat9Results = [...cat9Sections.tonKilo, ...cat9Sections.fuel, ...cat9Sections.fuelEfficiency]
  // Cat.10
  const cat10Results = calculateCat10(data.cat10, lookupFn)
  // Cat.11 (3セクション)
  const cat11Sections = calculateCat11(data.cat11, lookupFn, gwpGeneration)
  const cat11Results = [...cat11Sections.energy, ...cat11Sections.fuel, ...cat11Sections.ghg]
  // Cat.12
  const cat12Results = calculateCat12(data.cat12, lookupFn)
  // Cat.13 (Cat.8と同じ構造)
  const cat13Results = calculateCat8(data.cat13, lookupFn)
  // Cat.14
  const cat14Results = calculateCat14(data.cat14, lookupFn)
  // Cat.15
  const cat15Results = calculateCat15(data.cat15)

  const categoryNames = [
    '購入した製品・サービス', '資本財',
    'Scope1,2に含まれない燃料及びエネルギー関連活動',
    '輸送、配送（上流）', '事業から出る廃棄物',
    '出張', '雇用者の通勤',
    'リース資産（上流）', '輸送、配送（下流）',
    '販売した製品の加工', '販売した製品の使用',
    '販売した製品の廃棄', 'リース資産（下流）',
    'フランチャイズ', '投資',
  ]

  const allResults = [
    cat1Results, cat2Results, cat3Results, cat4Results, cat5Results,
    cat6Results, cat7Results, cat8Results, cat9Results, cat10Results,
    cat11Results, cat12Results, cat13Results, cat14Results, cat15Results,
  ]

  const categories: CategorySummary[] = allResults.map((results, idx) => ({
    categoryId: idx + 1,
    categoryName: categoryNames[idx],
    emission: sumEmissions(results),
    errorCount: countErrors(results),
    results,
  }))

  const scope3Total = categories.reduce((sum, c) => sum + c.emission, 0)

  return {
    categories,
    scope3Total,
    scope1,
    scope2,
    grandTotal: scope1 + scope2 + scope3Total,
  }
}
