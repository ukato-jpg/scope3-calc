/** IDEA排出原単位DBの1レコード */
export type IdeaRecord = {
  productCode: string
  productName: string
  country: string
  dbCategory: string
  baseFlow: number
  unit: string
  emissionFactor: number
}

/** 換算係数の1レコード */
export type ConversionFactorRecord = {
  productCode: string
  productName: string
  baseUnit: string
  conversionFactor: number
  conversionUnit: string
  source: string
}

/** Cat.2用 資本財排出原単位 */
export type CapitalGoodsRecord = {
  code: string
  subCode: string
  name: string
  emissionFactor: number
}

/** Cat.6.7用 交通区分別排出原単位 */
export type TransportFactorRecord = {
  name: string
  emissionFactor: number
  unit: string
}

/** Cat.7用 通勤排出原単位 */
export type CommutingFactorRecord = {
  name: string
  emissionFactor: number
  unit: string
}

/** Cat.11用 GWP係数 */
export type GwpRecord = {
  code: string
  name: string
  category: string
  unit: string
  ar6: number
  ar5: number
  ar4: number
}

/** Cat.3用 エネルギー種類プリセット */
export type EnergyPresetRecord = {
  id: number
  energyType: string
  ideaProductCode: string
}

/** Cat.6用 出張排出原単位 */
export type BusinessTravelFactors = {
  perEmployee: { factor: number; unit: string }
  perNight: { factor: number; unit: string }
}
