/** 計算パターンの種別 */
export type CalculationPattern =
  | 'idea-direct'
  | 'auxiliary-table'
  | 'idea-converted'
  | 'custom-factor'
  | 'gwp'
  | 'simple-multiply'

/** 排出量の計算結果 */
export type EmissionResult = {
  rowId: string
  emission_tCO2eq: number
  error?: string
}

/** GWP報告書の世代 */
export type GwpGeneration = 'ar4' | 'ar5' | 'ar6'

/** カテゴリの基本情報 */
export type CategoryInfo = {
  id: number
  name: string
  fullName: string
  scope: 'scope3'
  usesIdea: boolean
  description: string
}

/** アプリ全体の設定 */
export type AppSettings = {
  organizationName: string
  reportingYear: number
  gwpGeneration: GwpGeneration
  scope1Emission: number
  scope2Emission: number
}
