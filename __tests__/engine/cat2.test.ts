import { describe, it, expect } from 'vitest'
import { calculateCat2Row } from '@/engine/cat2'
import type { Cat2Entry } from '@/types/categories'

describe('Cat.2: 資本財', () => {
  it('資産額 × 排出原単位 で排出量を計算', () => {
    const entry: Cat2Entry = {
      id: 'test-1',
      name: 'テスト資本財',
      assetAmount: 100, // 百万円
      capitalGoodsCode: '01-0000', // 農林水産業 = 4.071... tCO2eq/百万円
    }
    const result = calculateCat2Row(entry)
    // コードが正しく引けることを確認
    expect(result.emission_tCO2eq).toBeGreaterThan(0)
    expect(result.error).toBeUndefined()
  })

  it('存在しないコードはエラー', () => {
    const entry: Cat2Entry = {
      id: 'test-2',
      name: 'テスト',
      assetAmount: 100,
      capitalGoodsCode: 'INVALID',
    }
    const result = calculateCat2Row(entry)
    expect(result.error).toBe('資本財コードが見つかりません')
  })
})
