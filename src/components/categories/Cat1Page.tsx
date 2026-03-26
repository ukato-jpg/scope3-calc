import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useCategoryStore, newId } from '@/store/category-store'
import { calculateCat1 } from '@/engine/cat1'
import { sumEmissions } from '@/engine/common'
import type { Cat1Entry } from '@/types/categories'

function createEmpty(): Cat1Entry {
  return {
    id: newId(),
    name: '',
    activityAmount: 0,
    unit: '',
    conversionFactor: null,
    conversionUnit: '',
    convertedAmount: null,
    convertedUnit: '',
    ideaProductCode: '',
    ideaProductName: '',
    ideaEmissionFactor: null,
    ideaBaseUnit: '',
    customFactorType: '',
    customFactorName: '',
    customEmissionFactor: null,
    customBaseUnit: '',
    customSource: '',
    factorSource: 'idea',
  }
}

export function Cat1Page() {
  const entries = useCategoryStore((s) => s.data.cat1)
  const update = useCategoryStore((s) => s.updateCategory)

  const results = useMemo(() => calculateCat1(entries), [entries])
  const total = useMemo(() => sumEmissions(results), [results])
  const resultMap = useMemo(
    () => new Map(results.map((r) => [r.rowId, r])),
    [results],
  )

  function setEntries(newEntries: Cat1Entry[]) {
    update('cat1', newEntries)
  }

  function addRow() {
    setEntries([...entries, createEmpty()])
  }

  function removeRow(id: string) {
    setEntries(entries.filter((e) => e.id !== id))
  }

  function updateRow(id: string, field: keyof Cat1Entry, value: string | number | null) {
    setEntries(
      entries.map((e) => (e.id === id ? { ...e, [field]: value } : e)),
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">カテゴリ1. 購入した製品・サービス</h1>
        <p className="text-muted-foreground mt-1">
          購入した製品・サービスの排出量を物量ベースまたは金額ベースで算定
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>算出方法</CardTitle>
          <CardDescription>
            GHG排出量 ＝ Σ（活動量 × 排出原単位）/ 10³ [t-CO2eq]
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
                <TableHead className="w-48">製品名</TableHead>
                <TableHead className="w-32 text-right">物量/金額</TableHead>
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
                        type="number"
                        value={entry.activityAmount || ''}
                        onChange={(e) =>
                          updateRow(entry.id, 'activityAmount', Number(e.target.value))
                        }
                        placeholder="0"
                        className="h-8 text-right"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        value={entry.unit}
                        onChange={(e) => updateRow(entry.id, 'unit', e.target.value)}
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
                        value={entry.ideaEmissionFactor ?? ''}
                        onChange={(e) =>
                          updateRow(
                            entry.id,
                            'ideaEmissionFactor',
                            e.target.value === '' ? null : Number(e.target.value),
                          )
                        }
                        placeholder="0"
                        className="h-8 text-right"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        value={entry.ideaBaseUnit}
                        onChange={(e) =>
                          updateRow(entry.id, 'ideaBaseUnit', e.target.value)
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
                  <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                    データがありません。「行を追加」ボタンで入力を開始してください。
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
