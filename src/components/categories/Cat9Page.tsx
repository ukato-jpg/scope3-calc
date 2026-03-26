import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useCategoryStore, newId } from '@/store/category-store'
import { calculateCat4 } from '@/engine/cat4'
import { sumEmissions } from '@/engine/common'
import type { Cat4TonKiloEntry, Cat4FuelEntry, Cat4FuelEfficiencyEntry, Cat9Data } from '@/types/categories'
import type { EmissionResult } from '@/types/common'

// --- 空行生成 ---
function createEmptyTonKilo(): Cat4TonKiloEntry {
  return {
    id: newId(), name: '', weight: 0, weightUnit: 't', origin: '', destination: '',
    transportMethod: '', distance: 0, tonKilo: 0, ideaProductCode: '',
  }
}

function createEmptyFuel(): Cat4FuelEntry {
  return {
    id: newId(), name: '', fuelType: '', usage: 0, unit: '',
    conversionFactor: null, conversionUnit: '', convertedAmount: null, ideaProductCode: '',
  }
}

function createEmptyFuelEfficiency(): Cat4FuelEfficiencyEntry {
  return {
    id: newId(), name: '', transportMethod: '', fuelType: '',
    fuelEfficiency: 0, distance: 0, fuelUsage: 0,
    conversionFactor: null, conversionUnit: '', convertedAmount: null, ideaProductCode: '',
  }
}

// --- 排出量表示ヘルパー ---
function EmissionCell({ result }: { result: EmissionResult | undefined }) {
  if (!result) return <span>—</span>
  if (result.error) return <span className="text-destructive text-xs">{result.error}</span>
  return <>{result.emission_tCO2eq.toLocaleString('ja-JP', { maximumFractionDigits: 4 })}</>
}

export function Cat9Page() {
  const data = useCategoryStore((s) => s.data.cat9)
  const update = useCategoryStore((s) => s.updateCategory)

  // IDEA DBがない場合はダミーのlookup
  const lookupFn = () => undefined

  const results = useMemo(() => calculateCat4(data, lookupFn), [data])
  const totalTonKilo = useMemo(() => sumEmissions(results.tonKilo), [results.tonKilo])
  const totalFuel = useMemo(() => sumEmissions(results.fuel), [results.fuel])
  const totalFuelEff = useMemo(() => sumEmissions(results.fuelEfficiency), [results.fuelEfficiency])
  const grandTotal = totalTonKilo + totalFuel + totalFuelEff

  const tonKiloMap = useMemo(() => new Map(results.tonKilo.map((r) => [r.rowId, r])), [results.tonKilo])
  const fuelMap = useMemo(() => new Map(results.fuel.map((r) => [r.rowId, r])), [results.fuel])
  const fuelEffMap = useMemo(() => new Map(results.fuelEfficiency.map((r) => [r.rowId, r])), [results.fuelEfficiency])

  // --- 更新関数 ---
  function setData(newData: Cat9Data) {
    update('cat9', newData)
  }

  // トンキロ法
  function addTonKilo() { setData({ ...data, tonKilo: [...data.tonKilo, createEmptyTonKilo()] }) }
  function removeTonKilo(id: string) { setData({ ...data, tonKilo: data.tonKilo.filter((e) => e.id !== id) }) }
  function updateTonKilo(id: string, field: keyof Cat4TonKiloEntry, value: string | number) {
    setData({ ...data, tonKilo: data.tonKilo.map((e) => (e.id === id ? { ...e, [field]: value } : e)) })
  }

  // 燃料法
  function addFuel() { setData({ ...data, fuel: [...data.fuel, createEmptyFuel()] }) }
  function removeFuel(id: string) { setData({ ...data, fuel: data.fuel.filter((e) => e.id !== id) }) }
  function updateFuel(id: string, field: keyof Cat4FuelEntry, value: string | number | null) {
    setData({ ...data, fuel: data.fuel.map((e) => (e.id === id ? { ...e, [field]: value } : e)) })
  }

  // 燃費法
  function addFuelEff() { setData({ ...data, fuelEfficiency: [...data.fuelEfficiency, createEmptyFuelEfficiency()] }) }
  function removeFuelEff(id: string) { setData({ ...data, fuelEfficiency: data.fuelEfficiency.filter((e) => e.id !== id) }) }
  function updateFuelEff(id: string, field: keyof Cat4FuelEfficiencyEntry, value: string | number | null) {
    setData({ ...data, fuelEfficiency: data.fuelEfficiency.map((e) => (e.id === id ? { ...e, [field]: value } : e)) })
  }

  // --- 空テーブル行 ---
  function EmptyRow({ colSpan }: { colSpan: number }) {
    return (
      <TableRow>
        <TableCell colSpan={colSpan} className="text-center text-muted-foreground py-8">
          データがありません。「行を追加」ボタンで入力を開始してください。
        </TableCell>
      </TableRow>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">カテゴリ9. 輸送、配送（下流）</h1>
        <p className="text-muted-foreground mt-1">
          販売した製品の最終消費者までの物流（自社が費用負担しない輸送）に伴う排出量を算定
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>算出方法</CardTitle>
          <CardDescription>
            トンキロ法 / 燃料法 / 燃費法 の3つの方法で算定。合計排出量 = {grandTotal.toLocaleString('ja-JP', { maximumFractionDigits: 4 })} t-CO2eq
          </CardDescription>
        </CardHeader>
      </Card>

      <Tabs defaultValue="tonKilo">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="tonKilo">トンキロ法</TabsTrigger>
          <TabsTrigger value="fuel">燃料法</TabsTrigger>
          <TabsTrigger value="fuelEfficiency">燃費法</TabsTrigger>
        </TabsList>

        {/* === セクション1: トンキロ法 === */}
        <TabsContent value="tonKilo">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>トンキロ法</CardTitle>
                <CardDescription>排出量 = トンキロ × 排出原単位</CardDescription>
              </div>
              <Button size="sm" onClick={addTonKilo}>行を追加</Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-40">名称</TableHead>
                    <TableHead className="w-24 text-right">重量 [t]</TableHead>
                    <TableHead className="w-28">出発地</TableHead>
                    <TableHead className="w-28">到着地</TableHead>
                    <TableHead className="w-28">輸送手段</TableHead>
                    <TableHead className="w-24 text-right">距離 [km]</TableHead>
                    <TableHead className="w-28 text-right">トンキロ</TableHead>
                    <TableHead className="w-32">IDEA製品コード</TableHead>
                    <TableHead className="w-36 text-right">排出量 [t-CO2eq]</TableHead>
                    <TableHead className="w-12" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.tonKilo.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell>
                        <Input value={entry.name} onChange={(e) => updateTonKilo(entry.id, 'name', e.target.value)} placeholder="名称" className="h-8" />
                      </TableCell>
                      <TableCell>
                        <Input type="number" value={entry.weight || ''} onChange={(e) => updateTonKilo(entry.id, 'weight', Number(e.target.value))} placeholder="0" className="h-8 text-right" />
                      </TableCell>
                      <TableCell>
                        <Input value={entry.origin} onChange={(e) => updateTonKilo(entry.id, 'origin', e.target.value)} placeholder="出発地" className="h-8" />
                      </TableCell>
                      <TableCell>
                        <Input value={entry.destination} onChange={(e) => updateTonKilo(entry.id, 'destination', e.target.value)} placeholder="到着地" className="h-8" />
                      </TableCell>
                      <TableCell>
                        <Input value={entry.transportMethod} onChange={(e) => updateTonKilo(entry.id, 'transportMethod', e.target.value)} placeholder="トラック等" className="h-8" />
                      </TableCell>
                      <TableCell>
                        <Input type="number" value={entry.distance || ''} onChange={(e) => updateTonKilo(entry.id, 'distance', Number(e.target.value))} placeholder="0" className="h-8 text-right" />
                      </TableCell>
                      <TableCell>
                        <Input type="number" value={entry.tonKilo || ''} onChange={(e) => updateTonKilo(entry.id, 'tonKilo', Number(e.target.value))} placeholder="0" className="h-8 text-right" />
                      </TableCell>
                      <TableCell>
                        <Input value={entry.ideaProductCode} onChange={(e) => updateTonKilo(entry.id, 'ideaProductCode', e.target.value)} placeholder="コード" className="h-8" />
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        <EmissionCell result={tonKiloMap.get(entry.id)} />
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" onClick={() => removeTonKilo(entry.id)} className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive">×</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {data.tonKilo.length === 0 && <EmptyRow colSpan={10} />}
                </TableBody>
                <TableFooter>
                  <TableRow>
                    <TableCell colSpan={8} className="font-bold">小計</TableCell>
                    <TableCell className="text-right font-mono font-bold">
                      {totalTonKilo.toLocaleString('ja-JP', { maximumFractionDigits: 4 })}
                    </TableCell>
                    <TableCell />
                  </TableRow>
                </TableFooter>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* === セクション2: 燃料法 === */}
        <TabsContent value="fuel">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>燃料法</CardTitle>
                <CardDescription>排出量 = 燃料使用量（換算後） × 排出原単位</CardDescription>
              </div>
              <Button size="sm" onClick={addFuel}>行を追加</Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-36">名称</TableHead>
                    <TableHead className="w-28">燃料種類</TableHead>
                    <TableHead className="w-24 text-right">使用量</TableHead>
                    <TableHead className="w-20">単位</TableHead>
                    <TableHead className="w-24 text-right">換算係数</TableHead>
                    <TableHead className="w-20">換算単位</TableHead>
                    <TableHead className="w-28 text-right">換算後量</TableHead>
                    <TableHead className="w-32">IDEA製品コード</TableHead>
                    <TableHead className="w-36 text-right">排出量 [t-CO2eq]</TableHead>
                    <TableHead className="w-12" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.fuel.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell>
                        <Input value={entry.name} onChange={(e) => updateFuel(entry.id, 'name', e.target.value)} placeholder="名称" className="h-8" />
                      </TableCell>
                      <TableCell>
                        <Input value={entry.fuelType} onChange={(e) => updateFuel(entry.id, 'fuelType', e.target.value)} placeholder="軽油等" className="h-8" />
                      </TableCell>
                      <TableCell>
                        <Input type="number" value={entry.usage || ''} onChange={(e) => updateFuel(entry.id, 'usage', Number(e.target.value))} placeholder="0" className="h-8 text-right" />
                      </TableCell>
                      <TableCell>
                        <Input value={entry.unit} onChange={(e) => updateFuel(entry.id, 'unit', e.target.value)} placeholder="L" className="h-8" />
                      </TableCell>
                      <TableCell>
                        <Input type="number" value={entry.conversionFactor ?? ''} onChange={(e) => updateFuel(entry.id, 'conversionFactor', e.target.value ? Number(e.target.value) : null)} placeholder="—" className="h-8 text-right" />
                      </TableCell>
                      <TableCell>
                        <Input value={entry.conversionUnit} onChange={(e) => updateFuel(entry.id, 'conversionUnit', e.target.value)} placeholder="GJ" className="h-8" />
                      </TableCell>
                      <TableCell>
                        <Input type="number" value={entry.convertedAmount ?? ''} onChange={(e) => updateFuel(entry.id, 'convertedAmount', e.target.value ? Number(e.target.value) : null)} placeholder="—" className="h-8 text-right" />
                      </TableCell>
                      <TableCell>
                        <Input value={entry.ideaProductCode} onChange={(e) => updateFuel(entry.id, 'ideaProductCode', e.target.value)} placeholder="コード" className="h-8" />
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        <EmissionCell result={fuelMap.get(entry.id)} />
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" onClick={() => removeFuel(entry.id)} className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive">×</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {data.fuel.length === 0 && <EmptyRow colSpan={10} />}
                </TableBody>
                <TableFooter>
                  <TableRow>
                    <TableCell colSpan={8} className="font-bold">小計</TableCell>
                    <TableCell className="text-right font-mono font-bold">
                      {totalFuel.toLocaleString('ja-JP', { maximumFractionDigits: 4 })}
                    </TableCell>
                    <TableCell />
                  </TableRow>
                </TableFooter>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* === セクション3: 燃費法 === */}
        <TabsContent value="fuelEfficiency">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>燃費法</CardTitle>
                <CardDescription>燃料使用量 = 距離 / 燃費 → 排出量 = 燃料使用量（換算後） × 排出原単位</CardDescription>
              </div>
              <Button size="sm" onClick={addFuelEff}>行を追加</Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-32">名称</TableHead>
                    <TableHead className="w-24">輸送手段</TableHead>
                    <TableHead className="w-24">燃料種類</TableHead>
                    <TableHead className="w-24 text-right">燃費 [km/L]</TableHead>
                    <TableHead className="w-24 text-right">距離 [km]</TableHead>
                    <TableHead className="w-24 text-right">燃料使用量</TableHead>
                    <TableHead className="w-20 text-right">換算係数</TableHead>
                    <TableHead className="w-20">換算単位</TableHead>
                    <TableHead className="w-24 text-right">換算後量</TableHead>
                    <TableHead className="w-28">IDEA製品コード</TableHead>
                    <TableHead className="w-32 text-right">排出量 [t-CO2eq]</TableHead>
                    <TableHead className="w-12" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.fuelEfficiency.map((entry) => {
                    const computedFuelUsage = entry.fuelEfficiency > 0 ? entry.distance / entry.fuelEfficiency : 0
                    return (
                      <TableRow key={entry.id}>
                        <TableCell>
                          <Input value={entry.name} onChange={(e) => updateFuelEff(entry.id, 'name', e.target.value)} placeholder="名称" className="h-8" />
                        </TableCell>
                        <TableCell>
                          <Input value={entry.transportMethod} onChange={(e) => updateFuelEff(entry.id, 'transportMethod', e.target.value)} placeholder="トラック等" className="h-8" />
                        </TableCell>
                        <TableCell>
                          <Input value={entry.fuelType} onChange={(e) => updateFuelEff(entry.id, 'fuelType', e.target.value)} placeholder="軽油等" className="h-8" />
                        </TableCell>
                        <TableCell>
                          <Input type="number" value={entry.fuelEfficiency || ''} onChange={(e) => updateFuelEff(entry.id, 'fuelEfficiency', Number(e.target.value))} placeholder="0" className="h-8 text-right" />
                        </TableCell>
                        <TableCell>
                          <Input type="number" value={entry.distance || ''} onChange={(e) => updateFuelEff(entry.id, 'distance', Number(e.target.value))} placeholder="0" className="h-8 text-right" />
                        </TableCell>
                        <TableCell className="text-right font-mono text-sm">
                          {computedFuelUsage ? computedFuelUsage.toLocaleString('ja-JP', { maximumFractionDigits: 2 }) : '—'}
                        </TableCell>
                        <TableCell>
                          <Input type="number" value={entry.conversionFactor ?? ''} onChange={(e) => updateFuelEff(entry.id, 'conversionFactor', e.target.value ? Number(e.target.value) : null)} placeholder="—" className="h-8 text-right" />
                        </TableCell>
                        <TableCell>
                          <Input value={entry.conversionUnit} onChange={(e) => updateFuelEff(entry.id, 'conversionUnit', e.target.value)} placeholder="GJ" className="h-8" />
                        </TableCell>
                        <TableCell>
                          <Input type="number" value={entry.convertedAmount ?? ''} onChange={(e) => updateFuelEff(entry.id, 'convertedAmount', e.target.value ? Number(e.target.value) : null)} placeholder="—" className="h-8 text-right" />
                        </TableCell>
                        <TableCell>
                          <Input value={entry.ideaProductCode} onChange={(e) => updateFuelEff(entry.id, 'ideaProductCode', e.target.value)} placeholder="コード" className="h-8" />
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          <EmissionCell result={fuelEffMap.get(entry.id)} />
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm" onClick={() => removeFuelEff(entry.id)} className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive">×</Button>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                  {data.fuelEfficiency.length === 0 && <EmptyRow colSpan={12} />}
                </TableBody>
                <TableFooter>
                  <TableRow>
                    <TableCell colSpan={10} className="font-bold">小計</TableCell>
                    <TableCell className="text-right font-mono font-bold">
                      {totalFuelEff.toLocaleString('ja-JP', { maximumFractionDigits: 4 })}
                    </TableCell>
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
