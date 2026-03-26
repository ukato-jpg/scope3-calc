import { useMemo, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useCategoryStore, newId } from '@/store/category-store'
import { calculateCat14 } from '@/engine/cat14'
import { sumEmissions } from '@/engine/common'
import type { Cat14Entry } from '@/types/categories'
import type { IdeaRecord } from '@/types/idea'

function createEmpty(): Cat14Entry {
  return {
    id: newId(), name: '', energyType: '',
    consumption: 0, consumptionUnit: '',
    conversionFactor: null, conversionUnit: '',
    convertedAmount: null, ideaProductCode: '',
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

export function Cat14Page() {
  const entries = useCategoryStore((s) => s.data.cat14)
  const update = useCategoryStore((s) => s.updateCategory)

  const [manualFactors, setManualFactors] = useState<ManualFactors>({})
  function setFactor(code: string, value: number) {
    setManualFactors((prev) => ({ ...prev, [code]: value }))
  }

  const lookupFn = useMemo(() => buildLookup(manualFactors), [manualFactors])
  const results = useMemo(() => calculateCat14(entries, lookupFn), [entries, lookupFn])
  const total = useMemo(() => sumEmissions(results), [results])
  const resultMap = useMemo(() => new Map(results.map((r) => [r.rowId, r])), [results])

  function setEntries(next: Cat14Entry[]) { update('cat14', next) }
  function addRow() { setEntries([...entries, createEmpty()]) }
  function removeRow(id: string) { setEntries(entries.filter((e) => e.id !== id)) }
  function updateRow(id: string, field: keyof Cat14Entry, value: string | number | null) {
    setEntries(entries.map((e) => (e.id === id ? { ...e, [field]: value } : e)))
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">カテゴリ14. フランチャイズ</h1>
        <p className="text-muted-foreground mt-1">
          フランチャイズ加盟店におけるエネルギー消費に伴う排出量
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>算出方法</CardTitle>
          <CardDescription>
            排出量 ＝ エネルギー消費量 × 排出原単位
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
                <TableHead className="w-44">フランチャイズ名</TableHead>
                <TableHead className="w-28">エネルギー種類</TableHead>
                <TableHead className="w-28 text-right">消費量</TableHead>
                <TableHead className="w-20">単位</TableHead>
                <TableHead className="w-36">IDEA製品コード</TableHead>
                <TableHead className="w-28 text-right">排出原単位</TableHead>
                <TableHead className="w-40 text-right">排出量 [t-CO2eq]</TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {entries.map((e) => {
                const r = resultMap.get(e.id)
                return (
                  <TableRow key={e.id}>
                    <TableCell><Input value={e.name} onChange={(ev) => updateRow(e.id, 'name', ev.target.value)} placeholder="フランチャイズ名" className="h-8" /></TableCell>
                    <TableCell><Input value={e.energyType} onChange={(ev) => updateRow(e.id, 'energyType', ev.target.value)} placeholder="電力等" className="h-8" /></TableCell>
                    <TableCell><Input type="number" value={e.consumption || ''} onChange={(ev) => updateRow(e.id, 'consumption', Number(ev.target.value))} className="h-8 text-right" /></TableCell>
                    <TableCell><Input value={e.consumptionUnit} onChange={(ev) => updateRow(e.id, 'consumptionUnit', ev.target.value)} placeholder="kWh等" className="h-8" /></TableCell>
                    <TableCell><Input value={e.ideaProductCode} onChange={(ev) => updateRow(e.id, 'ideaProductCode', ev.target.value)} placeholder="コード" className="h-8" /></TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        value={manualFactors[e.ideaProductCode] || ''}
                        onChange={(ev) => setFactor(e.ideaProductCode, Number(ev.target.value))}
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
                <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-8">データがありません。「行を追加」ボタンで入力を開始してください。</TableCell></TableRow>
              )}
            </TableBody>
            <TableFooter>
              <TableRow>
                <TableCell colSpan={6} className="font-bold">合計</TableCell>
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
