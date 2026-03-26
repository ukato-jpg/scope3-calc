import { describe, it, expect } from 'vitest'
import { calculateCat6TransportRow, calculateCat6AccommodationRow, calculateCat6EmployeeRow } from '@/engine/cat6'
import type { Cat6TransportEntry, Cat6AccommodationEntry, Cat6EmployeeEntry } from '@/types/categories'

describe('Cat.6: 出張', () => {
  describe('セクション1-1: 交通費支給額', () => {
    it('鉄道の交通費から排出量を計算', () => {
      const entry: Cat6TransportEntry = {
        id: 'test-1',
        name: '鉄道交通費',
        transportType: '旅客鉄道',
        amount: 500000, // 円
      }
      const result = calculateCat6TransportRow(entry)
      // 500000 * 0.00185377701736778 / 1000 = 0.926888508...
      expect(result.emission_tCO2eq).toBeCloseTo(0.9269, 3)
      expect(result.error).toBeUndefined()
    })

    it('存在しない交通区分はエラー', () => {
      const entry: Cat6TransportEntry = {
        id: 'test-2',
        name: 'テスト',
        transportType: '存在しない区分',
        amount: 100000,
      }
      const result = calculateCat6TransportRow(entry)
      expect(result.error).toBe('交通区分が見つかりません')
    })
  })

  describe('セクション1-2: 宿泊日数', () => {
    it('宿泊数から排出量を計算', () => {
      const entry: Cat6AccommodationEntry = {
        id: 'test-3',
        name: '出張宿泊',
        nights: 100,
      }
      const result = calculateCat6AccommodationRow(entry)
      // 100 * 31.53223799117 / 1000 = 3.15322379...
      expect(result.emission_tCO2eq).toBeCloseTo(3.1532, 3)
    })
  })

  describe('セクション2: 従業員数', () => {
    it('従業員数から排出量を計算', () => {
      const entry: Cat6EmployeeEntry = {
        id: 'test-4',
        name: '全社',
        employeeCount: 1000,
      }
      const result = calculateCat6EmployeeRow(entry)
      // 1000 * 0.130373426552145 = 130.373426...
      expect(result.emission_tCO2eq).toBeCloseTo(130.3734, 3)
    })
  })
})
