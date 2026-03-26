import { useMemo, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useCategoryStore, newId } from '@/store/category-store'
import { calculateCat8 } from '@/engine/cat8'
import { sumEmissions } from '@/engine/common'
import type { Cat13Entry } from '@/types/categories'
import type { IdeaRecord } from '@/types/idea'

function createEmpty(): Cat13Entry {
  return {
    id: newId(), name: '', energyType: '',
    usagePerUnit: 0, usageUnit: '', leaseCount: 0, leaseCountUnit: '台',
    totalUsage: 0, conversionFactor: null, conversionUnit: '',
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

export function Cat13Page() {
  const entries = useCategoryStore((s) => s.data.cat13)
  const update = useCategoryStore((s) => s.updateCategory)

  const [manualFactors, setManualFactors] = useState<ManualFactors>({})
  function setFactor(code: string, value: number) {
    setManualFactors((prev) => ({ ...prev, [code]: value }))
  }

  const lookupFn = useMemo(() => buildLookup(manualFactors), [manualFactors])
  // Cat13はCat8と同じ計算エンジンを使用
  const results = useMemo(() => calculateCat8(entries, lookupFn), [entries, lookupFn])
  const total = useMemo(() => sumEmissions(results), [results])
  const resultMap = useMemo(() => new Map(results.map((r) => [r.rowId, r])), [results])

  function setEntries(next: Cat13Entry[]) { update('cat13', next) }
  function addRow() { setEntries([...entries, createEmpty()]) }
  function removeRow(id: string) { setEntries(entries.filter((e) => e.id !== id)) }

  function updateRow(id: string, field: keyof Cat13Entry, value: string | number | null) {
    const updated = entries.map((e) => {
      if (e.id !== id) return e
      const next = { ...e, [field]: value }
      // 総使用量の自動計算
      if (field === 'usagePerUnit' || field === 'leaseCount') {
        const perUnit = field === 'usagePerUnit' ? (value as number) : next.usagePerUnit
        const count = field === 'leaseCount' ? (value as number) : next.leaseCount
        next.totalUsage = perUnit * count
      }
      return next
    })
    setEntries(updated)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">カテゴリ13. リース資産（下流）</h1>
        <p className="text-muted-foreground mt-1">
          自社がリースとして提供している資産の使用に伴う排出量
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>算出方法</CardTitle>
          <CardDescription>
            排出量 ＝ 総使用量（使用量/台 × リース数） × 排出原単位
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
                <TableHead className="w-36">資産名</TableHead>
                <TableHead className="w-28">エネルギー種類</TableHead>
                <TableHead className="w-24 text-right">使用量/台</TableHead>
                <TableHead className="w-20">単位</TableHead>
                <TableHead className="w-20 text-right">リース数</TableHead>
                <TableHead className="w-28 text-right">総使用量</TableHead>
                <TableHead className="w-32">IDEA製品コード</TableHead>
                <TableHead className="w-28 text-right">排出原単位</TableHead>
                <TableHead className="w-36 text-right">排出量 [t-CO2eq]</TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {entries.map((e) => {
                const r = resultMap.get(e.id)
                return (
                  <TableRow key={e.id}>
                    <TableCell><Input value={e.name} onChange={(ev) => updateRow(e.id, 'name', ev.target.value)} placeholder="資産名" className="h-8" /></TableCell>
                    <TableCell><Input value={e.energyType} onChange={(ev) => updateRow(e.id, 'energyType', ev.target.value)} placeholder="電力等" className="h-8" /></TableCell>
                    <TableCell><Input type="number" value={e.usagePerUnit || ''} onChange={(ev) => updateRow(e.id, 'usagePerUnit', Number(ev.target.value))} className="h-8 text-right" /></TableCell>
                    <TableCell><Input value={e.usageUnit} onChange={(ev) => updateRow(e.id, 'usageUnit', ev.target.value)} placeholder="kWh等" className="h-8" /></TableCell>
                    <TableCell><Input type="number" value={e.leaseCount || ''} onChange={(ev) => updateRow(e.id, 'leaseCount', Number(ev.target.value))} className="h-8 text-right" /></TableCell>
                    <TableCell className="text-right font-mono text-sm">{e.totalUsage ? fmt(e.totalUsage) : '—'}</TableCell>
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
