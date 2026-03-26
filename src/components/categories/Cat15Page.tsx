import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useCategoryStore, newId } from '@/store/category-store'
import { calculateCat15 } from '@/engine/cat15'
import { sumEmissions } from '@/engine/common'
import type { Cat15Entry } from '@/types/categories'

function createEmpty(): Cat15Entry {
  return { id: newId(), name: '', investeeEmission: 0, equityShare: 0 }
}

export function Cat15Page() {
  const entries = useCategoryStore((s) => s.data.cat15)
  const update = useCategoryStore((s) => s.updateCategory)

  const results = useMemo(() => calculateCat15(entries), [entries])
  const total = useMemo(() => sumEmissions(results), [results])
  const resultMap = useMemo(
    () => new Map(results.map((r) => [r.rowId, r])),
    [results],
  )

  function setEntries(newEntries: Cat15Entry[]) {
    update('cat15', newEntries)
  }

  function addRow() {
    setEntries([...entries, createEmpty()])
  }

  function removeRow(id: string) {
    setEntries(entries.filter((e) => e.id !== id))
  }

  function updateRow(id: string, field: keyof Cat15Entry, value: string | number) {
    setEntries(
      entries.map((e) => (e.id === id ? { ...e, [field]: value } : e)),
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">カテゴリ15. 投資</h1>
        <p className="text-muted-foreground mt-1">
          投資先のScope1,2排出量に持分比率を乗じて算定
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>算出方法</CardTitle>
          <CardDescription>
            GHG排出量 ＝ Σ（投資先のScope1,2排出量 × 持分比率）
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
                <TableHead className="w-64">投資項目名</TableHead>
                <TableHead className="w-48 text-right">
                  投資先Scope1,2排出量 [t-CO2eq]
                </TableHead>
                <TableHead className="w-32 text-right">持分比率 [%]</TableHead>
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
                        placeholder="投資項目名"
                        className="h-8"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        value={entry.investeeEmission || ''}
                        onChange={(e) =>
                          updateRow(entry.id, 'investeeEmission', Number(e.target.value))
                        }
                        placeholder="0"
                        className="h-8 text-right"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        value={entry.equityShare || ''}
                        onChange={(e) =>
                          updateRow(entry.id, 'equityShare', Number(e.target.value))
                        }
                        placeholder="0"
                        className="h-8 text-right"
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
