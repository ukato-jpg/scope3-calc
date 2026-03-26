import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useCategoryStore, newId } from '@/store/category-store'
import { useAppStore } from '@/store/app-store'
import { calculateCat11 } from '@/engine/cat11'
import { sumEmissions } from '@/engine/common'
import { getAllGwpRecords } from '@/engine/lookup'
import type { Cat11EnergyEntry, Cat11FuelEntry, Cat11GhgEntry, Cat11Data } from '@/types/categories'
import type { EmissionResult, GwpGeneration } from '@/types/common'

const gwpRecords = getAllGwpRecords()

const GWP_GENERATION_OPTIONS: { value: GwpGeneration; label: string }[] = [
  { value: 'ar4', label: 'AR4' },
  { value: 'ar5', label: 'AR5' },
  { value: 'ar6', label: 'AR6' },
]

// --- 空行生成 ---
function createEmptyEnergy(): Cat11EnergyEntry {
  return {
    id: newId(), name: '', energyType: '', consumptionPerUnit: 0, consumptionUnit: '',
    salesCount: 0, usageYears: 0,
    conversionFactor: null, conversionUnit: '', convertedAmount: null,
    ideaProductCode: '',
  }
}

function createEmptyFuel(): Cat11FuelEntry {
  return {
    id: newId(), name: '', amount: 0, unit: '',
    conversionFactor: null, conversionUnit: '', convertedAmount: null,
    customFactorName: '', customEmissionFactor: null, customBaseUnit: '', customSource: '',
  }
}

function createEmptyGhg(defaultGwp: GwpGeneration): Cat11GhgEntry {
  return {
    id: newId(), name: '', gasName: '', substanceAmount: 0,
    salesCount: 0, ratio: 100, gwpGeneration: defaultGwp,
  }
}

// --- 排出量表示ヘルパー ---
function EmissionCell({ result }: { result: EmissionResult | undefined }) {
  if (!result) return <span>—</span>
  if (result.error) return <span className="text-destructive text-xs">{result.error}</span>
  return <>{result.emission_tCO2eq.toLocaleString('ja-JP', { maximumFractionDigits: 4 })}</>
}

export function Cat11Page() {
  const data = useCategoryStore((s) => s.data.cat11)
  const update = useCategoryStore((s) => s.updateCategory)
  const defaultGwpGeneration = useAppStore((s) => s.settings.gwpGeneration)

  // IDEA DBがない場合はダミーのlookup
  const lookupFn = () => undefined

  const results = useMemo(
    () => calculateCat11(data, lookupFn, defaultGwpGeneration),
    [data, defaultGwpGeneration],
  )
  const totalEnergy = useMemo(() => sumEmissions(results.energy), [results.energy])
  const totalFuel = useMemo(() => sumEmissions(results.fuel), [results.fuel])
  const totalGhg = useMemo(() => sumEmissions(results.ghg), [results.ghg])
  const grandTotal = totalEnergy + totalFuel + totalGhg

  const energyMap = useMemo(() => new Map(results.energy.map((r) => [r.rowId, r])), [results.energy])
  const fuelMap = useMemo(() => new Map(results.fuel.map((r) => [r.rowId, r])), [results.fuel])
  const ghgMap = useMemo(() => new Map(results.ghg.map((r) => [r.rowId, r])), [results.ghg])

  // --- 更新関数 ---
  function setData(newData: Cat11Data) {
    update('cat11', newData)
  }

  // エネルギー（IDEA排出原単位）
  function addEnergy() { setData({ ...data, energy: [...data.energy, createEmptyEnergy()] }) }
  function removeEnergy(id: string) { setData({ ...data, energy: data.energy.filter((e) => e.id !== id) }) }
  function updateEnergy(id: string, field: keyof Cat11EnergyEntry, value: string | number | null) {
    setData({ ...data, energy: data.energy.map((e) => (e.id === id ? { ...e, [field]: value } : e)) })
  }

  // 燃料・フィードストック（独自排出原単位）
  function addFuel() { setData({ ...data, fuel: [...data.fuel, createEmptyFuel()] }) }
  function removeFuel(id: string) { setData({ ...data, fuel: data.fuel.filter((e) => e.id !== id) }) }
  function updateFuel(id: string, field: keyof Cat11FuelEntry, value: string | number | null) {
    setData({ ...data, fuel: data.fuel.map((e) => (e.id === id ? { ...e, [field]: value } : e)) })
  }

  // GHG直接排出
  function addGhg() { setData({ ...data, ghg: [...data.ghg, createEmptyGhg(defaultGwpGeneration)] }) }
  function removeGhg(id: string) { setData({ ...data, ghg: data.ghg.filter((e) => e.id !== id) }) }
  function updateGhg(id: string, field: keyof Cat11GhgEntry, value: string | number) {
    setData({ ...data, ghg: data.ghg.map((e) => (e.id === id ? { ...e, [field]: value } : e)) })
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
        <h1 className="text-2xl font-bold">カテゴリ11. 販売した製品の使用</h1>
        <p className="text-muted-foreground mt-1">
          販売した製品の使用時におけるエネルギー消費・燃料使用・GHG直接排出による排出量を算定
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>算出方法</CardTitle>
          <CardDescription>
            3つの算定方法で計算。合計排出量 = {grandTotal.toLocaleString('ja-JP', { maximumFractionDigits: 4 })} t-CO2eq
          </CardDescription>
        </CardHeader>
      </Card>

      <Tabs defaultValue="energy">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="energy">IDEA排出原単位</TabsTrigger>
          <TabsTrigger value="fuel">燃料・フィードストック</TabsTrigger>
          <TabsTrigger value="ghg">GHG直接排出</TabsTrigger>
        </TabsList>

        {/* === セクション1: IDEA排出原単位を使用する製品 === */}
        <TabsContent value="energy">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>IDEA排出原単位を使用する製品</CardTitle>
                <CardDescription>排出量 = エネルギー消費量/台 × 販売台数 × 使用年数 × 排出原単位</CardDescription>
              </div>
              <Button size="sm" onClick={addEnergy}>行を追加</Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-36">製品名</TableHead>
                    <TableHead className="w-28">エネルギー種類</TableHead>
                    <TableHead className="w-28 text-right">消費量/台</TableHead>
                    <TableHead className="w-20">単位</TableHead>
                    <TableHead className="w-24 text-right">販売台数</TableHead>
                    <TableHead className="w-20 text-right">使用年数</TableHead>
                    <TableHead className="w-28">IDEA製品コード</TableHead>
                    <TableHead className="w-32 text-right">排出量 [t-CO2eq]</TableHead>
                    <TableHead className="w-12" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.energy.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell>
                        <Input value={entry.name} onChange={(e) => updateEnergy(entry.id, 'name', e.target.value)} placeholder="製品名" className="h-8" />
                      </TableCell>
                      <TableCell>
                        <Input value={entry.energyType} onChange={(e) => updateEnergy(entry.id, 'energyType', e.target.value)} placeholder="電力等" className="h-8" />
                      </TableCell>
                      <TableCell>
                        <Input type="number" value={entry.consumptionPerUnit || ''} onChange={(e) => updateEnergy(entry.id, 'consumptionPerUnit', Number(e.target.value))} placeholder="0" className="h-8 text-right" />
                      </TableCell>
                      <TableCell>
                        <Input value={entry.consumptionUnit} onChange={(e) => updateEnergy(entry.id, 'consumptionUnit', e.target.value)} placeholder="kWh" className="h-8" />
                      </TableCell>
                      <TableCell>
                        <Input type="number" value={entry.salesCount || ''} onChange={(e) => updateEnergy(entry.id, 'salesCount', Number(e.target.value))} placeholder="0" className="h-8 text-right" />
                      </TableCell>
                      <TableCell>
                        <Input type="number" value={entry.usageYears || ''} onChange={(e) => updateEnergy(entry.id, 'usageYears', Number(e.target.value))} placeholder="0" className="h-8 text-right" />
                      </TableCell>
                      <TableCell>
                        <Input value={entry.ideaProductCode} onChange={(e) => updateEnergy(entry.id, 'ideaProductCode', e.target.value)} placeholder="コード" className="h-8" />
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        <EmissionCell result={energyMap.get(entry.id)} />
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" onClick={() => removeEnergy(entry.id)} className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive">×</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {data.energy.length === 0 && <EmptyRow colSpan={9} />}
                </TableBody>
                <TableFooter>
                  <TableRow>
                    <TableCell colSpan={7} className="font-bold">小計</TableCell>
                    <TableCell className="text-right font-mono font-bold">
                      {totalEnergy.toLocaleString('ja-JP', { maximumFractionDigits: 4 })}
                    </TableCell>
                    <TableCell />
                  </TableRow>
                </TableFooter>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* === セクション2: 燃料・フィードストック（独自排出原単位） === */}
        <TabsContent value="fuel">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>燃料・フィードストック（独自排出原単位）</CardTitle>
                <CardDescription>排出量 = 活動量（換算後） × 独自排出原単位</CardDescription>
              </div>
              <Button size="sm" onClick={addFuel}>行を追加</Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-36">名称</TableHead>
                    <TableHead className="w-24 text-right">量</TableHead>
                    <TableHead className="w-20">単位</TableHead>
                    <TableHead className="w-36">独自排出原単位名</TableHead>
                    <TableHead className="w-28 text-right">排出原単位値</TableHead>
                    <TableHead className="w-20">基準単位</TableHead>
                    <TableHead className="w-32 text-right">排出量 [t-CO2eq]</TableHead>
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
                        <Input type="number" value={entry.amount || ''} onChange={(e) => updateFuel(entry.id, 'amount', Number(e.target.value))} placeholder="0" className="h-8 text-right" />
                      </TableCell>
                      <TableCell>
                        <Input value={entry.unit} onChange={(e) => updateFuel(entry.id, 'unit', e.target.value)} placeholder="L" className="h-8" />
                      </TableCell>
                      <TableCell>
                        <Input value={entry.customFactorName} onChange={(e) => updateFuel(entry.id, 'customFactorName', e.target.value)} placeholder="原単位名" className="h-8" />
                      </TableCell>
                      <TableCell>
                        <Input type="number" value={entry.customEmissionFactor ?? ''} onChange={(e) => updateFuel(entry.id, 'customEmissionFactor', e.target.value ? Number(e.target.value) : null)} placeholder="0" className="h-8 text-right" />
                      </TableCell>
                      <TableCell>
                        <Input value={entry.customBaseUnit} onChange={(e) => updateFuel(entry.id, 'customBaseUnit', e.target.value)} placeholder="kg-CO2/L" className="h-8" />
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        <EmissionCell result={fuelMap.get(entry.id)} />
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" onClick={() => removeFuel(entry.id)} className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive">×</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {data.fuel.length === 0 && <EmptyRow colSpan={8} />}
                </TableBody>
                <TableFooter>
                  <TableRow>
                    <TableCell colSpan={6} className="font-bold">小計</TableCell>
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

        {/* === セクション3: GHG直接排出 === */}
        <TabsContent value="ghg">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>GHG直接排出</CardTitle>
                <CardDescription>排出量 = 物質量 × 販売台数 × 比率 × GWP係数</CardDescription>
              </div>
              <Button size="sm" onClick={addGhg}>行を追加</Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-32">製品名</TableHead>
                    <TableHead className="w-56">ガス名</TableHead>
                    <TableHead className="w-24 text-right">物質量 [kg]</TableHead>
                    <TableHead className="w-24 text-right">販売台数</TableHead>
                    <TableHead className="w-20 text-right">比率 [%]</TableHead>
                    <TableHead className="w-24">GWP世代</TableHead>
                    <TableHead className="w-32 text-right">排出量 [t-CO2eq]</TableHead>
                    <TableHead className="w-12" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.ghg.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell>
                        <Input value={entry.name} onChange={(e) => updateGhg(entry.id, 'name', e.target.value)} placeholder="製品名" className="h-8" />
                      </TableCell>
                      <TableCell>
                        <Select
                          value={entry.gasName}
                          onValueChange={(v) => { if (v) updateGhg(entry.id, 'gasName', v) }}
                        >
                          <SelectTrigger className="h-8">
                            <SelectValue placeholder="ガスを選択" />
                          </SelectTrigger>
                          <SelectContent>
                            {gwpRecords.map((rec) => (
                              <SelectItem key={rec.code} value={rec.name}>
                                {rec.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Input type="number" value={entry.substanceAmount || ''} onChange={(e) => updateGhg(entry.id, 'substanceAmount', Number(e.target.value))} placeholder="0" className="h-8 text-right" />
                      </TableCell>
                      <TableCell>
                        <Input type="number" value={entry.salesCount || ''} onChange={(e) => updateGhg(entry.id, 'salesCount', Number(e.target.value))} placeholder="0" className="h-8 text-right" />
                      </TableCell>
                      <TableCell>
                        <Input type="number" value={entry.ratio || ''} onChange={(e) => updateGhg(entry.id, 'ratio', Number(e.target.value))} placeholder="100" className="h-8 text-right" />
                      </TableCell>
                      <TableCell>
                        <Select
                          value={entry.gwpGeneration}
                          onValueChange={(v) => { if (v) updateGhg(entry.id, 'gwpGeneration', v) }}
                        >
                          <SelectTrigger className="h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {GWP_GENERATION_OPTIONS.map((opt) => (
                              <SelectItem key={opt.value} value={opt.value}>
                                {opt.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        <EmissionCell result={ghgMap.get(entry.id)} />
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" onClick={() => removeGhg(entry.id)} className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive">×</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {data.ghg.length === 0 && <EmptyRow colSpan={8} />}
                </TableBody>
                <TableFooter>
                  <TableRow>
                    <TableCell colSpan={6} className="font-bold">小計</TableCell>
                    <TableCell className="text-right font-mono font-bold">
                      {totalGhg.toLocaleString('ja-JP', { maximumFractionDigits: 4 })}
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
