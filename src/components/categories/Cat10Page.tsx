import { useMemo, useCallback, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useCategoryStore, newId } from '@/store/category-store'
import { calculateCat10 } from '@/engine/cat10'
import { sumEmissions } from '@/engine/common'
import type { Cat10Entry } from '@/types/categories'
import type { IdeaRecord } from '@/types/idea'

/** 手動入力した排出原単位を行ごとに保持 */
type ManualFactor = { emissionFactor: number; unit: string }
type ManualFactorMap = Record<string, ManualFactor>

function createEmpty(): Cat10Entry {
  return {
    id: newId(),
    name: '',
    processingMethod: '',
    salesQuantity: 0,
    salesUnit: '',
    ideaProductCode: '',
  }
}

export function Cat10Page() {
  const entries = useCategoryStore((s) => s.data.cat10)
  const update = useCategoryStore((s) => s.updateCategory)

  // 手動入力の排出原単位をローカルstateで管理（IDEA未インポート時の暫定対応）
  const [manualFactors, setManualFactors] = useState<ManualFactorMap>({})

  const lookupFn = useCallback(
    (code: string): IdeaRecord | undefined => {
      for (const entry of entries) {
        if (entry.ideaProductCode === code) {
          const factor = manualFactors[entry.id]
          if (factor && factor.emissionFactor > 0) {
            return {
              productCode: code,
              productName: entry.name,
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

  const results = useMemo(() => calculateCat10(entries, lookupFn), [entries, lookupFn])
  const total = useMemo(() => sumEmissions(results), [results])
  const resultMap = useMemo(
    () => new Map(results.map((r) => [r.rowId, r])),
    [results],
  )

  function setEntries(newEntries: Cat10Entry[]) {
    update('cat10', newEntries)
  }

  function addRow() {
    setEntries([...entries, createEmpty()])
  }

  function removeRow(id: string) {
    setEntries(entries.filter((e) => e.id !== id))
    setManualFactors((prev) => {
      const next = { ...prev }
      delete next[id]
      return next
    })
  }

  function updateRow(id: string, field: keyof Cat10Entry, value: string | number) {
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
        <h1 className="text-2xl font-bold">カテゴリ10. 販売した製品の加工</h1>
        <p className="text-muted-foreground mt-1">
          販売した中間製品が下流事業者で加工される際の排出量を算定
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>算出方法</CardTitle>
          <CardDescription>
            GHG排出量 ＝ Σ（販売数量 × 排出原単位）/ 10³ [t-CO2eq]
          </CardDescription>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>入力データ</CardTitle>
          <Button size="sm" onClick={addRow}>
            行を追加
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-44">製品名</TableHead>
                <TableHead className="w-40">加工方法</TableHead>
                <TableHead className="w-32 text-right">販売数量</TableHead>
                <TableHead className="w-24">販売数単位</TableHead>
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
                        value={entry.name}
                        onChange={(e) => updateRow(entry.id, 'name', e.target.value)}
                        placeholder="製品名"
                        className="h-8"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        value={entry.processingMethod}
                        onChange={(e) =>
                          updateRow(entry.id, 'processingMethod', e.target.value)
                        }
                        placeholder="加工方法"
                        className="h-8"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        value={entry.salesQuantity || ''}
                        onChange={(e) =>
                          updateRow(entry.id, 'salesQuantity', Number(e.target.value))
                        }
                        placeholder="0"
                        className="h-8 text-right"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        value={entry.salesUnit}
                        onChange={(e) =>
                          updateRow(entry.id, 'salesUnit', e.target.value)
                        }
                        placeholder="kg"
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
                        placeholder="kg"
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
                  <TableCell colSpan={9} className="text-center text-muted-foreground py-8">
                    データがありません。「行を追加」ボタンで入力を開始してください。
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
            <TableFooter>
              <TableRow>
                <TableCell colSpan={7} className="font-bold">合計</TableCell>
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
