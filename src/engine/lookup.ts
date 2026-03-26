import type { CapitalGoodsRecord, TransportFactorRecord, CommutingFactorRecord, GwpRecord, BusinessTravelFactors } from '@/types/idea'
import type { GwpGeneration } from '@/types/common'
import cat2Data from '@/data/cat2-capital-goods.json'
import cat67Data from '@/data/cat6-7-transport.json'
import cat6Data from '@/data/cat6-business-travel.json'
import cat7Data from '@/data/cat7-commuting.json'
import cat11GwpData from '@/data/cat11-gwp.json'

// 型キャスト
const capitalGoods = cat2Data as CapitalGoodsRecord[]
const transportFactors = cat67Data as TransportFactorRecord[]
const businessTravel = cat6Data as BusinessTravelFactors
const commutingFactors = cat7Data as CommutingFactorRecord[]
const gwpRecords = cat11GwpData as GwpRecord[]

// ============================================================
// Cat.2: 資本財排出原単位
// ============================================================

/** Cat.2用コードから排出原単位(tCO2eq/百万円)を取得 */
export function lookupCapitalGoods(code: string): CapitalGoodsRecord | undefined {
  return capitalGoods.find((r) => r.code === code || r.subCode === code)
}

/** Cat.2用テーブルの全データ */
export function getAllCapitalGoods(): CapitalGoodsRecord[] {
  return capitalGoods
}

// ============================================================
// Cat.6/7: 交通区分別排出原単位
// ============================================================

/** 交通区分名から排出原単位(kgCO2/円)を取得 */
export function lookupTransportFactor(name: string): number | undefined {
  const record = transportFactors.find((r) => r.name === name)
  return record?.emissionFactor
}

/** 交通区分の全データ */
export function getAllTransportFactors(): TransportFactorRecord[] {
  return transportFactors
}

// ============================================================
// Cat.6: 出張排出原単位
// ============================================================

/** 従業員当たり排出原単位(tCO2/人・年) */
export function getPerEmployeeFactor(): number {
  return businessTravel.perEmployee.factor
}

/** 宿泊当たり排出原単位(kgCO2/泊) */
export function getPerNightFactor(): number {
  return businessTravel.perNight.factor
}

// ============================================================
// Cat.7: 通勤排出原単位
// ============================================================

/** 勤務形態-都市区分名から排出原単位(kgCO2/人・日)を取得 */
export function lookupCommutingFactor(name: string): number | undefined {
  const record = commutingFactors.find((r) => r.name === name)
  return record?.emissionFactor
}

/** 通勤区分の全データ */
export function getAllCommutingFactors(): CommutingFactorRecord[] {
  return commutingFactors
}

// ============================================================
// Cat.11: GWP係数
// ============================================================

/** ガス名とIPCC世代からGWP係数を取得 */
export function lookupGwp(gasName: string, generation: GwpGeneration): number | undefined {
  const record = gwpRecords.find((r) => r.name === gasName)
  if (!record) return undefined
  return record[generation]
}

/** GWPテーブルの全データ */
export function getAllGwpRecords(): GwpRecord[] {
  return gwpRecords
}
