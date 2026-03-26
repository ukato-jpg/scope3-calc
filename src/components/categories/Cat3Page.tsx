import { useMemo, useCallback, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useCategoryStore, newId } from '@/store/category-store'
import { calculateCat3 } from '@/engine/cat3'
import { sumEmissions } from '@/engine/common'
import type { Cat3Entry } from '@/types/categories'
import type { IdeaRecord } from '@/types/idea'
import cat3Presets from '@/data/cat3-presets.json'

/** 手動入力した排出原単位を行ごとに保持 */
type ManualFactor = { emissionFactor: number; unit: string }
type ManualFactorMap = Record<string, ManualFactor>

function createEmpty(): Cat3Entry {
  return { id: newId(), name: '', energyType: '', usage: 0, unit: '', ideaProductCode: '' }
}

function createFromPreset(preset: (typeof cat3Presets)[number]): Cat3Entry {
  return {
    id: newId(),
    name: preset.energyType,
    energyType: preset.energyType,
    usage: 0,
    unit: '',
    ideaProductCode: preset.ideaProductCode,
  }
}

export function Cat3Page() {
  const entries = useCategoryStore((s) => s.data.cat3)
  const update = useCategoryStore((s) => s.updateCategory)

  // 手動入力の排出原単位をローカルstateで管理（IDEA未インポート時の暫定対応）
  const [manualFactors, setManualFactors] = useState<ManualFactorMap>({})

  const lookupFn = useCallback(
    (code: string): IdeaRecord | undefined => {
      // エントリからcodeに該当する手動入力値を探す
      for (const entry of entries) {
        if (entry.ideaProductCode === code) {
          const factor = manualFactors[entry.id]
          if (factor && factor.emissionFactor > 0) {
            return {
              productCode: code,
              productName: entry.energyType,
              country: 'JPN',
              dbCategory: '',
              baseFlow: 0,
              unit: factor.unit,
              emissionFactor: factor.emissionFactor,
            }
          }
        }
      }
      return undefined
    },
    [manualFactors, entries],
  )

  const results = useMemo(() => calculateCat3(entries, lookupFn), [entries, lookupFn])
  const total = useMemo(() => sumEmissions(results), [results])
  const resultMap = useMemo(
    () => new Map(results.map((r) => [r.rowId, r])),
    [results],
  )

  function setEntries(newEntries: Cat3Entry[]) {
    update('cat3', newEntries)
  }

  function addRow() {
    setEntries([...entries, createEmpty()])
  }

  function addPresetRows() {
    const presetEntries = cat3Presets.map(createFromPreset)
    setEntries([...entries, ...presetEntries])
  }

  function removeRow(id: string) {
    setEntries(entries.filter((e) => e.id !== id))
    setManualFactors((prev) => {
      const next = { ...prev }
      delete next[id]
      return next
    })
  }

  function updateRow(id: string, field: keyof Cat3Entry, value: string | number) {
    setEntries(
      entries.map((e) => (e.id === id ? { ...e, [field]: value } : e)),
    )
  }

  function updateManualFactor(id: string, field: 'emissionFactor' | 'unit', value: number | string) {
    setManualFactors((prev) => {
      const current = prev[id] || { emissionFactor: 0, unit: '' }
      return { ...prev, [id]: { ...current, [field]: value } }
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">
          カテゴリ3. Scope1,2に含まれない燃料及びエネルギー関連活動
        </h1>
        <p className="text-muted-foreground mt-1">
          購入した燃料・電力の上流工程（採掘・精製・送配電ロス等）に伴う排出量を算定
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>算出方法</CardTitle>
          <CardDescription>
            GHG排出量 ＝ Σ（エネルギー使用量 × IDEA排出原単位）/ 10³ [t-CO2eq]
          </CardDescription>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>入力データ</CardTitle>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={addPresetRows}>
              プリセット行を追加
            </Button>
            <Button size="sm" onClick={addRow}>
              行を追加
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-56">エネルギー種類</TableHead>
                <TableHead className="w-32 text-right">使用量</TableHead>
                <TableHead className="w-24">単位</TableHead>
                <TableHead className="w-36">IDEA製品コード</TableHead>
                <TableHead className="w-36 text-right">
                  排出原単位 [kg-CO2eq]
                </TableHead>
                <TableHead className="w-24">基準単位</TableHead>
                <TableHead className="w-40 text-right">排出量 [t-CO2eq]</TableHead>
                <TableHead className="w-16" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {entries.map((entry) => {
                const result = resultMap.get(entry.id)
                const manual = manualFactors[entry.id]
                return (
                  <TableRow key={entry.id}>
                    <TableCell>
                      <Input
                        value={entry.energyType}
                        onChange={(e) =>
                          updateRow(entry.id, 'energyType', e.target.value)
                        }
                        placeholder="エネルギー種類"
                        className="h-8"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        value={entry.usage || ''}
                        onChange={(e) =>
                          updateRow(entry.id, 'usage', Number(e.target.value))
                        }
                        placeholder="0"
                        className="h-8 text-right"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        value={entry.unit}
                        onChange={(e) => updateRow(entry.id, 'unit', e.target.value)}
                        placeholder="kWh"
                        className="h-8"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        value={entry.ideaProductCode}
                        onChange={(e) =>
                          updateRow(entry.id, 'ideaProductCode', e.target.value)
                        }
                        placeholder="コード"
                        className="h-8 font-mono text-xs"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        value={manual?.emissionFactor || ''}
                        onChange={(e) =>
                          updateManualFactor(
                            entry.id,
                            'emissionFactor',
                            Number(e.target.value),
                          )
                        }
                        placeholder="0"
                        className="h-8 text-right"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        value={manual?.unit ?? ''}
                        onChange={(e) =>
                          updateManualFactor(entry.id, 'unit', e.target.value)
                        }
                        placeholder="kWh"
                        className="h-8"
                      />
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {result
                        ? result.error
                          ? <span className="text-destructive text-xs">{result.error}</span>
                          : result.emission_tCO2eq.toLocaleString('ja-JP', { maximumFractionDigits: 4 })
                        : '—'}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeRow(entry.id)}
                        className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                      >
                        ×
                      </Button>
                    </TableCell>
                  </TableRow>
                )
              })}
              {entries.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                    データがありません。「プリセット行を追加」でエネルギー種類を一括セットできます。
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
            <TableFooter>
              <TableRow>
                <TableCell colSpan={6} className="font-bold">合計</TableCell>
                <TableCell className="text-right font-mono font-bold">
                  {total.toLocaleString('ja-JP', { maximumFractionDigits: 4 })}
                </TableCell>
                <TableCell />
              </TableRow>
            </TableFooter>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
