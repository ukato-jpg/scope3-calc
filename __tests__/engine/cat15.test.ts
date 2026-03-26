import { describe, it, expect } from 'vitest'
import { calculateCat15, calculateCat15Row } from '@/engine/cat15'
import type { Cat15Entry } from '@/types/categories'

describe('Cat.15: 投資', () => {
  it('排出量 = 投資先排出量 × 持分比率/100', () => {
    const entry: Cat15Entry = {
      id: 'test-1',
      name: '投資先A',
      investeeEmission: 14000, // t-CO2eq
      equityShare: 100, // %
    }
    const result = calculateCat15Row(entry)
    expect(result.emission_tCO2eq).toBe(14000)
    expect(result.error).toBeUndefined()
  })

  it('持分比率50%の場合', () => {
    const entry: Cat15Entry = {
      id: 'test-2',
      name: '投資先B',
      investeeEmission: 10000,
      equityShare: 50,
    }
    const result = calculateCat15Row(entry)
    expect(result.emission_tCO2eq).toBe(5000)
  })

  it('ゼロ入力', () => {
    const entry: Cat15Entry = {
      id: 'test-3',
      name: '投資先C',
      investeeEmission: 0,
      equityShare: 100,
    }
    const result = calculateCat15Row(entry)
    expect(result.emission_tCO2eq).toBe(0)
  })

  it('複数行の合計', () => {
    const entries: Cat15Entry[] = [
      { id: '1', name: 'A', investeeEmission: 10000, equityShare: 100 },
      { id: '2', name: 'B', investeeEmission: 8000, equityShare: 50 },
    ]
    const results = calculateCat15(entries)
    const total = results.reduce((s, r) => s + r.emission_tCO2eq, 0)
    expect(total).toBe(14000)
  })

  it('名前が空の行はスキップ', () => {
    const entries: Cat15Entry[] = [
      { id: '1', name: '', investeeEmission: 10000, equityShare: 100 },
    ]
    const results = calculateCat15(entries)
    expect(results).toHaveLength(0)
  })
})
