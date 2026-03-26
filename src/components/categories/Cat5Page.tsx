import { useMemo, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useCategoryStore, newId } from '@/store/category-store'
import { calculateCat5 } from '@/engine/cat5'
import { sumEmissions } from '@/engine/common'
import type { Cat5Entry } from '@/types/categories'
import type { IdeaRecord } from '@/types/idea'

function createEmpty(): Cat5Entry {
  return {
    id: newId(), name: '', wasteAmount: 0, treatmentMethod: '',
    transportOrigin: '', transportDestination: '', transportMethod: '',
    tonKilo: 0, transportIdeaProductCode: '', treatmentIdeaProductCode: '',
  }
}

type ManualFactors = Record<string, number>

function buildLookup(factors: ManualFactors): (code: string) => IdeaRecord | undefined {
  return (code) => {
    if (!code) return undefined
    const ef = factors[code]
    if (ef === undefined || ef === 0) return undefined
    return {
      productCode: code, productName: '手動入力', country: '',
      dbCategory: '', baseFlow: 0, unit: '', emissionFactor: ef,
    }
  }
}

const fmt = (v: number) => v.toLocaleString('ja-JP', { maximumFractionDigits: 4 })

export function Cat5Page() {
  const entries = useCategoryStore((s) => s.data.cat5)
  const update = useCategoryStore((s) => s.updateCategory)

  const [manualFactors, setManualFactors] = useState<ManualFactors>({})
  function setFactor(code: string, value: number) {
    setManualFactors((prev) => ({ ...prev, [code]: value }))
  }

  const lookupFn = useMemo(() => buildLookup(manualFactors), [manualFactors])
  const results = useMemo(() => calculateCat5(entries, lookupFn), [entries, lookupFn])
  const total = useMemo(() => sumEmissions(results), [results])
  const resultMap = useMemo(() => new Map(results.map((r) => [r.rowId, r])), [results])

  function setEntries(next: Cat5Entry[]) { update('cat5', next) }
  function addRow() { setEntries([...entries, createEmpty()]) }
  function removeRow(id: string) { setEntries(entries.filter((e) => e.id !== id)) }
  function updateRow(id: string, field: keyof Cat5Entry, value: string | number) {
    setEntries(entries.map((e) => (e.id === id ? { ...e, [field]: value } : e)))
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">カテゴリ5. 事業から出る廃棄物</h1>
        <p className="text-muted-foreground mt-1">
          自社事業で発生した廃棄物の処理および輸送による排出量
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>算出方法</CardTitle>
          <CardDescription>
            排出量 ＝ 処理量(t) × 排出原単位 ＋ 輸送トンキロ × 輸送排出原単位
          </CardDescription>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>入力データ</CardTitle>
          <Button size="sm" onClick={addRow}>行を追加</Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-36">廃棄物名</TableHead>
                <TableHead className="w-24 text-right">処理量 [t]</TableHead>
                <TableHead className="w-28">処理方法</TableHead>
                <TableHead className="w-32">処理IDEA製品コード</TableHead>
                <TableHead className="w-24 text-right">処理排出原単位</TableHead>
                <TableHead className="w-24 text-right">輸送トンキロ</TableHead>
                <TableHead className="w-32">輸送IDEA製品コード</TableHead>
                <TableHead className="w-24 text-right">輸送排出原単位</TableHead>
                <TableHead className="w-36 text-right">排出量 [t-CO2eq]</TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {entries.map((e) => {
                const r = resultMap.get(e.id)
                return (
                  <TableRow key={e.id}>
                    <TableCell><Input value={e.name} onChange={(ev) => updateRow(e.id, 'name', ev.target.value)} placeholder="廃棄物名" className="h-8" /></TableCell>
                    <TableCell><Input type="number" value={e.wasteAmount || ''} onChange={(ev) => updateRow(e.id, 'wasteAmount', Number(ev.target.value))} className="h-8 text-right" /></TableCell>
                    <TableCell><Input value={e.treatmentMethod} onChange={(ev) => updateRow(e.id, 'treatmentMethod', ev.target.value)} placeholder="焼却等" className="h-8" /></TableCell>
                    <TableCell><Input value={e.treatmentIdeaProductCode} onChange={(ev) => updateRow(e.id, 'treatmentIdeaProductCode', ev.target.value)} placeholder="コード" className="h-8" /></TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        value={manualFactors[e.treatmentIdeaProductCode] || ''}
                        onChange={(ev) => setFactor(e.treatmentIdeaProductCode, Number(ev.target.value))}
                        placeholder="原単位"
                        className="h-8 text-right"
                      />
                    </TableCell>
                    <TableCell><Input type="number" value={e.tonKilo || ''} onChange={(ev) => updateRow(e.id, 'tonKilo', Number(ev.target.value))} className="h-8 text-right" /></TableCell>
                    <TableCell><Input value={e.transportIdeaProductCode} onChange={(ev) => updateRow(e.id, 'transportIdeaProductCode', ev.target.value)} placeholder="コード" className="h-8" /></TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        value={manualFactors[e.transportIdeaProductCode] || ''}
                        onChange={(ev) => setFactor(e.transportIdeaProductCode, Number(ev.target.value))}
                        placeholder="原単位"
                        className="h-8 text-right"
                      />
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {r ? r.error ? <span className="text-destructive text-xs">{r.error}</span> : fmt(r.emission_tCO2eq) : '—'}
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" onClick={() => removeRow(e.id)} className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive">×</Button>
                    </TableCell>
                  </TableRow>
                )
              })}
              {entries.length === 0 && (
                <TableRow><TableCell colSpan={10} className="text-center text-muted-foreground py-8">データがありません。「行を追加」ボタンで入力を開始してください。</TableCell></TableRow>
              )}
            </TableBody>
            <TableFooter>
              <TableRow>
                <TableCell colSpan={8} className="font-bold">合計</TableCell>
                <TableCell className="text-right font-mono font-bold">{fmt(total)}</TableCell>
                <TableCell />
              </TableRow>
            </TableFooter>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
