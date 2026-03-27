import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useCategoryStore, newId } from '@/store/category-store'
import { calculateScope1 } from '@/engine/scope1'
import { sumEmissions } from '@/engine/common'
import type { Scope1Entry } from '@/types/categories'
import fuelsData from '@/data/scope1-fuels.json'

type FuelPreset = { name: string; unit: string; factor: number; factorUnit: string; description: string; category: string }
const fuels = fuelsData as FuelPreset[]

function createEmpty(): Scope1Entry {
  return { id: newId(), name: '', fuelType: '', usage: 0, unit: '', emissionFactor: 0 }
}

export function Scope1Page() {
  const entries = useCategoryStore((s) => s.scope1)
  const updateScope1 = useCategoryStore((s) => s.updateScope1)

  const results = useMemo(() => calculateScope1(entries), [entries])
  const total = useMemo(() => sumEmissions(results), [results])
  const resultMap = useMemo(() => new Map(results.map((r) => [r.rowId, r])), [results])

  function setEntries(newEntries: Scope1Entry[]) {
    updateScope1(newEntries)
  }

  function addRow() {
    setEntries([...entries, createEmpty()])
  }

  function removeRow(id: string) {
    setEntries(entries.filter((e) => e.id !== id))
  }

  function updateRow(id: string, field: keyof Scope1Entry, value: string | number) {
    setEntries(entries.map((e) => (e.id === id ? { ...e, [field]: value } : e)))
  }

  function selectFuel(id: string, fuelName: string) {
    const fuel = fuels.find((f) => f.name === fuelName)
    if (!fuel) return
    setEntries(entries.map((e) =>
      e.id === id
        ? { ...e, fuelType: fuel.name, name: fuel.name, unit: fuel.unit, emissionFactor: fuel.factor }
        : e,
    ))
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Scope 1: 直接排出</h1>
        <p className="text-muted-foreground mt-1">
          事業者自らによる温室効果ガスの直接排出（燃料の燃焼、工業プロセス）
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>算出方法</CardTitle>
          <CardDescription>
            GHG排出量 ＝ Σ（燃料使用量 × 燃料種類別排出係数）
          </CardDescription>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>燃料使用量</CardTitle>
          <Button size="sm" onClick={addRow}>行を追加</Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-56">燃料種類</TableHead>
                <TableHead className="w-20">用途</TableHead>
                <TableHead className="w-36 text-right">使用量</TableHead>
                <TableHead className="w-16">単位</TableHead>
                <TableHead className="w-36 text-right">排出係数</TableHead>
                <TableHead className="w-36 text-right">排出量 [t-CO2]</TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {entries.map((entry) => {
                const result = resultMap.get(entry.id)
                return (
                  <TableRow key={entry.id}>
                    <TableCell>
                      <Select
                        value={entry.fuelType}
                        onValueChange={(v) => { if (v) selectFuel(entry.id, v) }}
                      >
                        <SelectTrigger className="h-8">
                          <SelectValue placeholder="燃料を選択" />
                        </SelectTrigger>
                        <SelectContent>
                          {fuels.map((f) => (
                            <SelectItem key={f.name} value={f.name}>
                              <div>
                                <div>{f.name}</div>
                                <div className="text-[10px] text-muted-foreground">
                                  {f.description} — {f.factor} {f.factorUnit}
                                </div>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Input
                        value={entry.name !== entry.fuelType ? entry.name : ''}
                        onChange={(e) => updateRow(entry.id, 'name', e.target.value || entry.fuelType)}
                        placeholder="用途"
                        className="h-8"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        value={entry.usage || ''}
                        onChange={(e) => updateRow(entry.id, 'usage', Number(e.target.value))}
                        placeholder="0"
                        className="h-8 text-right"
                      />
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {entry.unit}
                    </TableCell>
                    <TableCell className="text-right text-sm text-muted-foreground">
                      {entry.emissionFactor > 0 && `${entry.emissionFactor} kg-CO2/${entry.unit}`}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {result && result.emission_tCO2eq > 0
                        ? result.emission_tCO2eq.toLocaleString('ja-JP', { maximumFractionDigits: 4 })
                        : '—'}
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" onClick={() => removeRow(entry.id)} className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive">×</Button>
                    </TableCell>
                  </TableRow>
                )
              })}
              {entries.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    データがありません。「行を追加」ボタンで入力を開始してください。
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
            <TableFooter>
              <TableRow>
                <TableCell colSpan={5} className="font-bold">Scope 1 合計</TableCell>
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
