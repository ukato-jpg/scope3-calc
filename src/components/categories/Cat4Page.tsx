import { useMemo, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useCategoryStore, newId } from '@/store/category-store'
import { calculateCat4 } from '@/engine/cat4'
import { sumEmissions } from '@/engine/common'
import type { Cat4TonKiloEntry, Cat4FuelEntry, Cat4FuelEfficiencyEntry } from '@/types/categories'
import type { IdeaRecord } from '@/types/idea'

/* ---------- 空行の生成 ---------- */
function createEmptyTonKilo(): Cat4TonKiloEntry {
  return {
    id: newId(), name: '', weight: 0, weightUnit: 't',
    origin: '', destination: '', transportMethod: '',
    distance: 0, tonKilo: 0, ideaProductCode: '',
  }
}

function createEmptyFuel(): Cat4FuelEntry {
  return {
    id: newId(), name: '', fuelType: '', usage: 0, unit: '',
    conversionFactor: null, conversionUnit: '', convertedAmount: null,
    ideaProductCode: '',
  }
}

function createEmptyFuelEfficiency(): Cat4FuelEfficiencyEntry {
  return {
    id: newId(), name: '', transportMethod: '', fuelType: '',
    fuelEfficiency: 0, distance: 0, fuelUsage: 0,
    conversionFactor: null, conversionUnit: '', convertedAmount: null,
    ideaProductCode: '',
  }
}

/* ---------- 手動排出原単位の管理 ---------- */
type ManualFactors = Record<string, number>

function buildLookup(factors: ManualFactors): (code: string) => IdeaRecord | undefined {
  return (code: string) => {
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

/* ========== メインコンポーネント ========== */
export function Cat4Page() {
  const data = useCategoryStore((s) => s.data.cat4)
  const update = useCategoryStore((s) => s.updateCategory)

  // 手動排出原単位（ideaProductCode → emissionFactor）
  const [manualFactors, setManualFactors] = useState<ManualFactors>({})

  function setFactor(code: string, value: number) {
    setManualFactors((prev) => ({ ...prev, [code]: value }))
  }

  const lookupFn = useMemo(() => buildLookup(manualFactors), [manualFactors])

  const results = useMemo(() => calculateCat4(data, lookupFn), [data, lookupFn])
  const totalTK = useMemo(() => sumEmissions(results.tonKilo), [results])
  const totalFuel = useMemo(() => sumEmissions(results.fuel), [results])
  const totalFE = useMemo(() => sumEmissions(results.fuelEfficiency), [results])
  const grandTotal = totalTK + totalFuel + totalFE

  const tkMap = useMemo(() => new Map(results.tonKilo.map((r) => [r.rowId, r])), [results])
  const fuelMap = useMemo(() => new Map(results.fuel.map((r) => [r.rowId, r])), [results])
  const feMap = useMemo(() => new Map(results.fuelEfficiency.map((r) => [r.rowId, r])), [results])

  /* --- トンキロ法 --- */
  function setTonKilo(entries: Cat4TonKiloEntry[]) {
    update('cat4', { ...data, tonKilo: entries })
  }
  function updateTKRow(id: string, field: keyof Cat4TonKiloEntry, value: string | number) {
    const updated = data.tonKilo.map((e) => {
      if (e.id !== id) return e
      const next = { ...e, [field]: value }
      // トンキロ自動計算
      if (field === 'weight' || field === 'distance') {
        next.tonKilo = (field === 'weight' ? (value as number) : next.weight)
          * (field === 'distance' ? (value as number) : next.distance)
      }
      return next
    })
    setTonKilo(updated)
  }

  /* --- 燃料法 --- */
  function setFuelEntries(entries: Cat4FuelEntry[]) {
    update('cat4', { ...data, fuel: entries })
  }
  function updateFuelRow(id: string, field: keyof Cat4FuelEntry, value: string | number | null) {
    setFuelEntries(data.fuel.map((e) => (e.id === id ? { ...e, [field]: value } : e)))
  }

  /* --- 燃費法 --- */
  function setFEEntries(entries: Cat4FuelEfficiencyEntry[]) {
    update('cat4', { ...data, fuelEfficiency: entries })
  }
  function updateFERow(id: string, field: keyof Cat4FuelEfficiencyEntry, value: string | number | null) {
    const updated = data.fuelEfficiency.map((e) => {
      if (e.id !== id) return e
      const next = { ...e, [field]: value }
      // 燃料使用量自動計算
      if (field === 'distance' || field === 'fuelEfficiency') {
        const dist = field === 'distance' ? (value as number) : next.distance
        const eff = field === 'fuelEfficiency' ? (value as number) : next.fuelEfficiency
        next.fuelUsage = eff > 0 ? dist / eff : 0
      }
      return next
    })
    setFEEntries(updated)
  }

  function renderResult(map: Map<string, { rowId: string; emission_tCO2eq: number; error?: string }>, id: string) {
    const r = map.get(id)
    if (!r) return '—'
    if (r.error) return <span className="text-destructive text-xs">{r.error}</span>
    return fmt(r.emission_tCO2eq)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">カテゴリ4. 輸送、配送（上流）</h1>
        <p className="text-muted-foreground mt-1">
          購入した製品の上流輸送による排出量を3つの手法で算定
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>算出方法</CardTitle>
          <CardDescription>
            トンキロ法 / 燃料法 / 燃費法の3セクションに分けて算定し、合計を求めます
          </CardDescription>
        </CardHeader>
      </Card>

      {/* ---- 全体合計カード ---- */}
      <Card>
        <CardHeader>
          <CardTitle>カテゴリ4 合計</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4 text-sm">
            <div><span className="text-muted-foreground">トンキロ法</span><p className="text-lg font-mono font-bold">{fmt(totalTK)}</p></div>
            <div><span className="text-muted-foreground">燃料法</span><p className="text-lg font-mono font-bold">{fmt(totalFuel)}</p></div>
            <div><span className="text-muted-foreground">燃費法</span><p className="text-lg font-mono font-bold">{fmt(totalFE)}</p></div>
            <div><span className="text-muted-foreground">合計 [t-CO2eq]</span><p className="text-xl font-mono font-bold">{fmt(grandTotal)}</p></div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="tonKilo">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="tonKilo">トンキロ法</TabsTrigger>
          <TabsTrigger value="fuel">燃料法</TabsTrigger>
          <TabsTrigger value="fuelEfficiency">燃費法</TabsTrigger>
        </TabsList>

        {/* ============ トンキロ法 ============ */}
        <TabsContent value="tonKilo">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>トンキロ法</CardTitle>
              <Button size="sm" onClick={() => setTonKilo([...data.tonKilo, createEmptyTonKilo()])}>行を追加</Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-40">製品名</TableHead>
                    <TableHead className="w-24 text-right">重量 [t]</TableHead>
                    <TableHead className="w-28">発地</TableHead>
                    <TableHead className="w-28">着地</TableHead>
                    <TableHead className="w-28">輸送手段</TableHead>
                    <TableHead className="w-24 text-right">距離 [km]</TableHead>
                    <TableHead className="w-28 text-right">トンキロ</TableHead>
                    <TableHead className="w-32">IDEA製品コード</TableHead>
                    <TableHead className="w-28 text-right">排出原単位</TableHead>
                    <TableHead className="w-36 text-right">排出量 [t-CO2eq]</TableHead>
                    <TableHead className="w-12" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.tonKilo.map((e) => (
                    <TableRow key={e.id}>
                      <TableCell><Input value={e.name} onChange={(ev) => updateTKRow(e.id, 'name', ev.target.value)} placeholder="製品名" className="h-8" /></TableCell>
                      <TableCell><Input type="number" value={e.weight || ''} onChange={(ev) => updateTKRow(e.id, 'weight', Number(ev.target.value))} className="h-8 text-right" /></TableCell>
                      <TableCell><Input value={e.origin} onChange={(ev) => updateTKRow(e.id, 'origin', ev.target.value)} placeholder="発地" className="h-8" /></TableCell>
                      <TableCell><Input value={e.destination} onChange={(ev) => updateTKRow(e.id, 'destination', ev.target.value)} placeholder="着地" className="h-8" /></TableCell>
                      <TableCell><Input value={e.transportMethod} onChange={(ev) => updateTKRow(e.id, 'transportMethod', ev.target.value)} placeholder="トラック等" className="h-8" /></TableCell>
                      <TableCell><Input type="number" value={e.distance || ''} onChange={(ev) => updateTKRow(e.id, 'distance', Number(ev.target.value))} className="h-8 text-right" /></TableCell>
                      <TableCell className="text-right font-mono text-sm">{e.tonKilo ? fmt(e.tonKilo) : '—'}</TableCell>
                      <TableCell><Input value={e.ideaProductCode} onChange={(ev) => updateTKRow(e.id, 'ideaProductCode', ev.target.value)} placeholder="コード" className="h-8" /></TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          value={manualFactors[e.ideaProductCode] || ''}
                          onChange={(ev) => setFactor(e.ideaProductCode, Number(ev.target.value))}
                          placeholder="原単位"
                          className="h-8 text-right"
                        />
                      </TableCell>
                      <TableCell className="text-right font-mono">{renderResult(tkMap, e.id)}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" onClick={() => setTonKilo(data.tonKilo.filter((r) => r.id !== e.id))} className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive">×</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {data.tonKilo.length === 0 && (
                    <TableRow><TableCell colSpan={11} className="text-center text-muted-foreground py-8">データがありません。「行を追加」ボタンで入力を開始してください。</TableCell></TableRow>
                  )}
                </TableBody>
                <TableFooter>
                  <TableRow>
                    <TableCell colSpan={9} className="font-bold">小計</TableCell>
                    <TableCell className="text-right font-mono font-bold">{fmt(totalTK)}</TableCell>
                    <TableCell />
                  </TableRow>
                </TableFooter>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ============ 燃料法 ============ */}
        <TabsContent value="fuel">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>燃料法</CardTitle>
              <Button size="sm" onClick={() => setFuelEntries([...data.fuel, createEmptyFuel()])}>行を追加</Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-40">燃料名</TableHead>
                    <TableHead className="w-28 text-right">使用量</TableHead>
                    <TableHead className="w-24">単位</TableHead>
                    <TableHead className="w-32">IDEA製品コード</TableHead>
                    <TableHead className="w-28 text-right">排出原単位</TableHead>
                    <TableHead className="w-36 text-right">排出量 [t-CO2eq]</TableHead>
                    <TableHead className="w-12" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.fuel.map((e) => (
                    <TableRow key={e.id}>
                      <TableCell><Input value={e.name} onChange={(ev) => updateFuelRow(e.id, 'name', ev.target.value)} placeholder="燃料名" className="h-8" /></TableCell>
                      <TableCell><Input type="number" value={e.usage || ''} onChange={(ev) => updateFuelRow(e.id, 'usage', Number(ev.target.value))} className="h-8 text-right" /></TableCell>
                      <TableCell><Input value={e.unit} onChange={(ev) => updateFuelRow(e.id, 'unit', ev.target.value)} placeholder="L等" className="h-8" /></TableCell>
                      <TableCell><Input value={e.ideaProductCode} onChange={(ev) => updateFuelRow(e.id, 'ideaProductCode', ev.target.value)} placeholder="コード" className="h-8" /></TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          value={manualFactors[e.ideaProductCode] || ''}
                          onChange={(ev) => setFactor(e.ideaProductCode, Number(ev.target.value))}
                          placeholder="原単位"
                          className="h-8 text-right"
                        />
                      </TableCell>
                      <TableCell className="text-right font-mono">{renderResult(fuelMap, e.id)}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" onClick={() => setFuelEntries(data.fuel.filter((r) => r.id !== e.id))} className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive">×</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {data.fuel.length === 0 && (
                    <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">データがありません。「行を追加」ボタンで入力を開始してください。</TableCell></TableRow>
                  )}
                </TableBody>
                <TableFooter>
                  <TableRow>
                    <TableCell colSpan={5} className="font-bold">小計</TableCell>
                    <TableCell className="text-right font-mono font-bold">{fmt(totalFuel)}</TableCell>
                    <TableCell />
                  </TableRow>
                </TableFooter>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ============ 燃費法 ============ */}
        <TabsContent value="fuelEfficiency">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>燃費法</CardTitle>
              <Button size="sm" onClick={() => setFEEntries([...data.fuelEfficiency, createEmptyFuelEfficiency()])}>行を追加</Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-36">輸送手段</TableHead>
                    <TableHead className="w-28">燃料種類</TableHead>
                    <TableHead className="w-24 text-right">燃費 [km/L]</TableHead>
                    <TableHead className="w-24 text-right">距離 [km]</TableHead>
                    <TableHead className="w-28 text-right">燃料使用量</TableHead>
                    <TableHead className="w-32">IDEA製品コード</TableHead>
                    <TableHead className="w-28 text-right">排出原単位</TableHead>
                    <TableHead className="w-36 text-right">排出量 [t-CO2eq]</TableHead>
                    <TableHead className="w-12" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.fuelEfficiency.map((e) => (
                    <TableRow key={e.id}>
                      <TableCell><Input value={e.transportMethod} onChange={(ev) => updateFERow(e.id, 'transportMethod', ev.target.value)} placeholder="トラック等" className="h-8" /></TableCell>
                      <TableCell><Input value={e.fuelType} onChange={(ev) => updateFERow(e.id, 'fuelType', ev.target.value)} placeholder="軽油等" className="h-8" /></TableCell>
                      <TableCell><Input type="number" value={e.fuelEfficiency || ''} onChange={(ev) => updateFERow(e.id, 'fuelEfficiency', Number(ev.target.value))} className="h-8 text-right" /></TableCell>
                      <TableCell><Input type="number" value={e.distance || ''} onChange={(ev) => updateFERow(e.id, 'distance', Number(ev.target.value))} className="h-8 text-right" /></TableCell>
                      <TableCell className="text-right font-mono text-sm">{e.fuelUsage ? fmt(e.fuelUsage) : '—'}</TableCell>
                      <TableCell><Input value={e.ideaProductCode} onChange={(ev) => updateFERow(e.id, 'ideaProductCode', ev.target.value)} placeholder="コード" className="h-8" /></TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          value={manualFactors[e.ideaProductCode] || ''}
                          onChange={(ev) => setFactor(e.ideaProductCode, Number(ev.target.value))}
                          placeholder="原単位"
                          className="h-8 text-right"
                        />
                      </TableCell>
                      <TableCell className="text-right font-mono">{renderResult(feMap, e.id)}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" onClick={() => setFEEntries(data.fuelEfficiency.filter((r) => r.id !== e.id))} className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive">×</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {data.fuelEfficiency.length === 0 && (
                    <TableRow><TableCell colSpan={9} className="text-center text-muted-foreground py-8">データがありません。「行を追加」ボタンで入力を開始してください。</TableCell></TableRow>
                  )}
                </TableBody>
                <TableFooter>
                  <TableRow>
                    <TableCell colSpan={7} className="font-bold">小計</TableCell>
                    <TableCell className="text-right font-mono font-bold">{fmt(totalFE)}</TableCell>
                    <TableCell />
                  </TableRow>
                </TableFooter>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
