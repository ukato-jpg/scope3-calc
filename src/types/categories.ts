/** 全カテゴリ共通の入力行ベース */
export type BaseEntry = {
  id: string
  name: string
}

// ============================================================
// Scope 1: 燃料の燃焼による直接排出
// ============================================================
export type Scope1Entry = BaseEntry & {
  fuelType: string         // 燃料種類（プリセット名）
  usage: number            // 使用量
  unit: string             // 単位
  emissionFactor: number   // 排出係数 (kg-CO2/単位)
}

// ============================================================
// Scope 2: 購入した電気・熱の使用
// ============================================================
export type Scope2ElectricityEntry = BaseEntry & {
  utility: string          // 電気事業者名
  usage: number            // 使用量 (kWh)
  emissionFactor: number   // 排出係数 (kg-CO2/kWh)
}

export type Scope2HeatEntry = BaseEntry & {
  heatType: string         // 蒸気/温水/冷水
  usage: number            // 使用量 (GJ)
  emissionFactor: number   // 排出係数 (kg-CO2/GJ)
}

export type Scope2Data = {
  electricity: Scope2ElectricityEntry[]
  heat: Scope2HeatEntry[]
}

// ============================================================
// Cat.1: 購入した製品・サービス
// ============================================================
export type Cat1Entry = BaseEntry & {
  activityAmount: number
  unit: string
  conversionFactor: number | null
  conversionUnit: string
  convertedAmount: number | null
  convertedUnit: string
  ideaProductCode: string
  // IDEA自動参照値（IDEAインポート後に自動設定）
  ideaProductName: string
  ideaEmissionFactor: number | null
  ideaBaseUnit: string
  // 独自排出原単位
  customFactorType: string
  customFactorName: string
  customEmissionFactor: number | null
  customBaseUnit: string
  customSource: string
  // 使用する排出原単位の選択: 'idea' | 'custom'
  factorSource: 'idea' | 'custom'
}

// ============================================================
// Cat.2: 資本財
// ============================================================
export type Cat2Entry = BaseEntry & {
  assetAmount: number // 百万円
  capitalGoodsCode: string // Cat.2用テーブルのコード
}

// ============================================================
// Cat.3: Scope1,2に含まれない燃料及びエネルギー関連活動
// ============================================================
export type Cat3Entry = BaseEntry & {
  energyType: string
  usage: number
  unit: string
  ideaProductCode: string // プリセット
}

// ============================================================
// Cat.4: 輸送、配送（上流） / Cat.9: 輸送、配送（下流）
// ============================================================
export type Cat4TonKiloEntry = BaseEntry & {
  weight: number // トン
  weightUnit: string
  origin: string
  destination: string
  transportMethod: string
  distance: number // km
  tonKilo: number
  ideaProductCode: string
}

export type Cat4FuelEntry = BaseEntry & {
  fuelType: string
  usage: number
  unit: string
  conversionFactor: number | null
  conversionUnit: string
  convertedAmount: number | null
  ideaProductCode: string
}

export type Cat4FuelEfficiencyEntry = BaseEntry & {
  transportMethod: string
  fuelType: string
  fuelEfficiency: number // km/L等
  distance: number // km
  fuelUsage: number // 自動計算
  conversionFactor: number | null
  conversionUnit: string
  convertedAmount: number | null
  ideaProductCode: string
}

export type Cat4Data = {
  tonKilo: Cat4TonKiloEntry[]
  fuel: Cat4FuelEntry[]
  fuelEfficiency: Cat4FuelEfficiencyEntry[]
}

// Cat.9は Cat.4と同じ構造
export type Cat9Data = Cat4Data

// ============================================================
// Cat.5: 事業から出る廃棄物
// ============================================================
export type Cat5Entry = BaseEntry & {
  wasteAmount: number // トン
  treatmentMethod: string
  // 輸送（任意）
  transportOrigin: string
  transportDestination: string
  transportMethod: string
  tonKilo: number
  transportIdeaProductCode: string
  // 廃棄物処理
  treatmentIdeaProductCode: string
}

// ============================================================
// Cat.6: 出張
// ============================================================
export type Cat6TransportEntry = BaseEntry & {
  transportType: string // Cat.6.7用テーブルの区分名
  amount: number // 円
}

export type Cat6AccommodationEntry = BaseEntry & {
  nights: number // 泊
}

export type Cat6EmployeeEntry = BaseEntry & {
  employeeCount: number // 人
}

export type Cat6Data = {
  transport: Cat6TransportEntry[]
  accommodation: Cat6AccommodationEntry[]
  employee: Cat6EmployeeEntry[]
}

// ============================================================
// Cat.7: 雇用者の通勤
// ============================================================
export type Cat7TransportEntry = BaseEntry & {
  transportType: string // Cat.6.7用テーブルの区分名
  amount: number // 円
}

export type Cat7CommutingEntry = BaseEntry & {
  workStyleCity: string // Cat.7用テーブルの区分名
  employeeCount: number
  workDays: number
}

export type Cat7Data = {
  transport: Cat7TransportEntry[]
  commuting: Cat7CommutingEntry[]
}

// ============================================================
// Cat.8: リース資産（上流） / Cat.13: リース資産（下流）
// ============================================================
export type Cat8Entry = BaseEntry & {
  energyType: string
  usagePerUnit: number
  usageUnit: string
  leaseCount: number
  leaseCountUnit: string
  totalUsage: number // 自動計算 = usagePerUnit * leaseCount
  conversionFactor: number | null
  conversionUnit: string
  convertedAmount: number | null
  ideaProductCode: string
}

// Cat.13は Cat.8と同じ構造
export type Cat13Entry = Cat8Entry

// ============================================================
// Cat.10: 販売した製品の加工
// ============================================================
export type Cat10Entry = BaseEntry & {
  processingMethod: string
  salesQuantity: number
  salesUnit: string
  ideaProductCode: string
}

// ============================================================
// Cat.11: 販売した製品の使用
// ============================================================
export type Cat11EnergyEntry = BaseEntry & {
  energyType: string
  consumptionPerUnit: number
  consumptionUnit: string
  salesCount: number
  usageYears: number
  conversionFactor: number | null
  conversionUnit: string
  convertedAmount: number | null
  ideaProductCode: string
}

export type Cat11FuelEntry = BaseEntry & {
  amount: number
  unit: string
  conversionFactor: number | null
  conversionUnit: string
  convertedAmount: number | null
  customFactorName: string
  customEmissionFactor: number | null
  customBaseUnit: string
  customSource: string
}

export type Cat11GhgEntry = BaseEntry & {
  gasName: string // Cat.11用GWPテーブルのフロー名
  substanceAmount: number // kg
  salesCount: number
  ratio: number // %
  gwpGeneration: 'ar4' | 'ar5' | 'ar6'
}

export type Cat11Data = {
  energy: Cat11EnergyEntry[]
  fuel: Cat11FuelEntry[]
  ghg: Cat11GhgEntry[]
}

// ============================================================
// Cat.12: 販売した製品の廃棄
// ============================================================
export type Cat12Entry = BaseEntry & {
  wasteAmount: number // トン
  treatmentMethod: string
  ideaProductCode: string
}

// ============================================================
// Cat.14: フランチャイズ
// ============================================================
export type Cat14Entry = BaseEntry & {
  energyType: string
  consumption: number
  consumptionUnit: string
  conversionFactor: number | null
  conversionUnit: string
  convertedAmount: number | null
  ideaProductCode: string
}

// ============================================================
// Cat.15: 投資
// ============================================================
export type Cat15Entry = BaseEntry & {
  investeeEmission: number // t-CO2eq (投資先のScope1,2排出量)
  equityShare: number // % (持分比率)
}

// ============================================================
// 全カテゴリのデータを統合する型
// ============================================================
export type AllCategoryData = {
  cat1: Cat1Entry[]
  cat2: Cat2Entry[]
  cat3: Cat3Entry[]
  cat4: Cat4Data
  cat5: Cat5Entry[]
  cat6: Cat6Data
  cat7: Cat7Data
  cat8: Cat8Entry[]
  cat9: Cat9Data
  cat10: Cat10Entry[]
  cat11: Cat11Data
  cat12: Cat12Entry[]
  cat13: Cat13Entry[]
  cat14: Cat14Entry[]
  cat15: Cat15Entry[]
}
