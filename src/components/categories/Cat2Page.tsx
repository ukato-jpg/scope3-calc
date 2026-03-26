import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useCategoryStore, newId } from '@/store/category-store'
import { calculateCat2 } from '@/engine/cat2'
import { sumEmissions } from '@/engine/common'
import { getAllCapitalGoods } from '@/engine/lookup'
import type { Cat2Entry } from '@/types/categories'

const capitalGoodsList = getAllCapitalGoods()

function createEmpty(): Cat2Entry {
  return { id: newId(), name: '', assetAmount: 0, capitalGoodsCode: '' }
}

export function Cat2Page() {
  const entries = useCategoryStore((s) => s.data.cat2)
  const update = useCategoryStore((s) => s.updateCategory)

  const results = useMemo(() => calculateCat2(entries), [entries])
  const total = useMemo(() => sumEmissions(results), [results])
  const resultMap = useMemo(
    () => new Map(results.map((r) => [r.rowId, r])),
    [results],
  )

  function setEntries(newEntries: Cat2Entry[]) {
    update('cat2', newEntries)
  }

  function addRow() {
    setEntries([...entries, createEmpty()])
  }

  function removeRow(id: string) {
    setEntries(entries.filter((e) => e.id !== id))
  }

  function updateRow(id: string, field: keyof Cat2Entry, value: string | number) {
    setEntries(
      entries.map((e) => (e.id === id ? { ...e, [field]: value } : e)),
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">カテゴリ2. 資本財</h1>
        <p className="text-muted-foreground mt-1">
          購入・取得した資本財の製造時等の排出量を算定
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>算出方法</CardTitle>
          <CardDescription>
            GHG排出量 ＝ Σ（資産額[百万円] × 排出原単位[tCO2eq/百万円]）
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
                <TableHead className="w-48">名称</TableHead>
                <TableHead className="w-36 text-right">資産額 [百万円]</TableHead>
                <TableHead className="w-72">資本財コード</TableHead>
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
                        placeholder="名称"
                        className="h-8"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        value={entry.assetAmount || ''}
                        onChange={(e) =>
                          updateRow(entry.id, 'assetAmount', Number(e.target.value))
                        }
                        placeholder="0"
                        className="h-8 text-right"
                      />
                    </TableCell>
                    <TableCell>
                      <Select
                        value={entry.capitalGoodsCode}
                        onValueChange={(v) => { if (v) updateRow(entry.id, 'capitalGoodsCode', v) }}
                      >
                        <SelectTrigger className="h-8">
                          <SelectValue placeholder="資本財を選択" />
                        </SelectTrigger>
                        <SelectContent>
                          {capitalGoodsList.map((cg) => (
                            <SelectItem key={cg.code} value={cg.code}>
                              {cg.name}（{cg.emissionFactor} tCO2eq/百万円）
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
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
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    データがありません。「行を追加」ボタンで入力を開始してください。
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
            <TableFooter>
              <TableRow>
                <TableCell colSpan={3} className="font-bold">合計</TableCell>
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
