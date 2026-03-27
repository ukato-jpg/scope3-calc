import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useCategoryStore, newId } from '@/store/category-store'
import { calculateScope2 } from '@/engine/scope2'
import { sumEmissions } from '@/engine/common'
import type { Scope2Data, Scope2ElectricityEntry, Scope2HeatEntry } from '@/types/categories'
import scope2Data from '@/data/scope2-electricity.json'

const utilities = scope2Data.utilities as { name: string; factor: number; factorUnit: string; description: string }[]
const heatTypes = scope2Data.heat as { name: string; unit: string; factor: number; factorUnit: string; description: string }[]

function createEmptyElectricity(): Scope2ElectricityEntry {
  return { id: newId(), name: '', utility: '', usage: 0, emissionFactor: 0 }
}

function createEmptyHeat(): Scope2HeatEntry {
  return { id: newId(), name: '', heatType: '', usage: 0, emissionFactor: 0 }
}

export function Scope2Page() {
  const data = useCategoryStore((s) => s.scope2)
  const updateScope2 = useCategoryStore((s) => s.updateScope2)

  const results = useMemo(() => calculateScope2(data), [data])
  const elecTotal = useMemo(() => sumEmissions(results.electricity), [results])
  const heatTotal = useMemo(() => sumEmissions(results.heat), [results])
  const total = elecTotal + heatTotal
  const elecResultMap = useMemo(() => new Map(results.electricity.map((r) => [r.rowId, r])), [results])
  const heatResultMap = useMemo(() => new Map(results.heat.map((r) => [r.rowId, r])), [results])

  function setData(patch: Partial<Scope2Data>) {
    updateScope2({ ...data, ...patch })
  }

  // --- 電力 ---
  function addElec() { setData({ electricity: [...data.electricity, createEmptyElectricity()] }) }
  function removeElec(id: string) { setData({ electricity: data.electricity.filter((e) => e.id !== id) }) }
  function updateElec(id: string, field: keyof Scope2ElectricityEntry, value: string | number) {
    setData({ electricity: data.electricity.map((e) => (e.id === id ? { ...e, [field]: value } : e)) })
  }
  function selectUtility(id: string, utilityName: string) {
    const u = utilities.find((u) => u.name === utilityName)
    if (!u) return
    setData({
      electricity: data.electricity.map((e) =>
        e.id === id ? { ...e, utility: u.name, name: e.name || u.name, emissionFactor: u.factor } : e,
      ),
    })
  }

  // --- 熱 ---
  function addHeat() { setData({ heat: [...data.heat, createEmptyHeat()] }) }
  function removeHeat(id: string) { setData({ heat: data.heat.filter((e) => e.id !== id) }) }
  function updateHeat(id: string, field: keyof Scope2HeatEntry, value: string | number) {
    setData({ heat: data.heat.map((e) => (e.id === id ? { ...e, [field]: value } : e)) })
  }
  function selectHeatType(id: string, typeName: string) {
    const h = heatTypes.find((h) => h.name === typeName)
    if (!h) return
    setData({
      heat: data.heat.map((e) =>
        e.id === id ? { ...e, heatType: h.name, name: e.name || h.name, emissionFactor: h.factor } : e,
      ),
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Scope 2: エネルギー起源間接排出</h1>
        <p className="text-muted-foreground mt-1">
          他社から供給された電気、熱・蒸気の使用に伴う間接排出
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>算出方法</CardTitle>
          <CardDescription>
            GHG排出量 ＝ 電力使用量 × 電気事業者別排出係数 ＋ 購入熱量 × 熱排出係数
          </CardDescription>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            Scope 2 合計: {total.toLocaleString('ja-JP', { maximumFractionDigits: 2 })} t-CO2
          </CardTitle>
        </CardHeader>
      </Card>

      <Tabs defaultValue="electricity">
        <TabsList>
          <TabsTrigger value="electricity">
            電力 ({elecTotal.toLocaleString('ja-JP', { maximumFractionDigits: 2 })})
          </TabsTrigger>
          <TabsTrigger value="heat">
            熱・蒸気 ({heatTotal.toLocaleString('ja-JP', { maximumFractionDigits: 2 })})
          </TabsTrigger>
        </TabsList>

        {/* 電力タブ */}
        <TabsContent value="electricity">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">電力使用量</CardTitle>
              <Button size="sm" onClick={addElec}>行を追加</Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-56">電気事業者</TableHead>
                    <TableHead className="w-32">拠点・用途</TableHead>
                    <TableHead className="w-36 text-right">使用量 [kWh]</TableHead>
                    <TableHead className="w-36 text-right">排出係数 [kg-CO2/kWh]</TableHead>
                    <TableHead className="w-36 text-right">排出量 [t-CO2]</TableHead>
                    <TableHead className="w-12" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.electricity.map((entry) => {
                    const result = elecResultMap.get(entry.id)
                    return (
                      <TableRow key={entry.id}>
                        <TableCell>
                          <Select value={entry.utility} onValueChange={(v) => { if (v) selectUtility(entry.id, v) }}>
                            <SelectTrigger className="h-8">
                              <SelectValue placeholder="事業者を選択" />
                            </SelectTrigger>
                            <SelectContent>
                              {utilities.map((u) => (
                                <SelectItem key={u.name} value={u.name}>
                                  <div>
                                    <div>{u.name}</div>
                                    <div className="text-[10px] text-muted-foreground">{u.factor} {u.factorUnit}</div>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Input value={entry.name !== entry.utility ? entry.name : ''} onChange={(e) => updateElec(entry.id, 'name', e.target.value || entry.utility)} placeholder="本社等" className="h-8" />
                        </TableCell>
                        <TableCell>
                          <Input type="number" value={entry.usage || ''} onChange={(e) => updateElec(entry.id, 'usage', Number(e.target.value))} placeholder="0" className="h-8 text-right" />
                        </TableCell>
                        <TableCell className="text-right text-sm text-muted-foreground">
                          {entry.emissionFactor > 0 && entry.emissionFactor}
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {result && result.emission_tCO2eq > 0 ? result.emission_tCO2eq.toLocaleString('ja-JP', { maximumFractionDigits: 4 }) : '—'}
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm" onClick={() => removeElec(entry.id)} className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive">×</Button>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                  {data.electricity.length === 0 && (
                    <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">「行を追加」で入力を開始</TableCell></TableRow>
                  )}
                </TableBody>
                <TableFooter>
                  <TableRow>
                    <TableCell colSpan={4} className="font-bold">電力 小計</TableCell>
                    <TableCell className="text-right font-mono font-bold">{elecTotal.toLocaleString('ja-JP', { maximumFractionDigits: 4 })}</TableCell>
                    <TableCell />
                  </TableRow>
                </TableFooter>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 熱タブ */}
        <TabsContent value="heat">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">購入した熱・蒸気</CardTitle>
              <Button size="sm" onClick={addHeat}>行を追加</Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-48">種類</TableHead>
                    <TableHead className="w-32">用途</TableHead>
                    <TableHead className="w-36 text-right">使用量 [GJ]</TableHead>
                    <TableHead className="w-36 text-right">排出係数 [kg-CO2/GJ]</TableHead>
                    <TableHead className="w-36 text-right">排出量 [t-CO2]</TableHead>
                    <TableHead className="w-12" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.heat.map((entry) => {
                    const result = heatResultMap.get(entry.id)
                    return (
                      <TableRow key={entry.id}>
                        <TableCell>
                          <Select value={entry.heatType} onValueChange={(v) => { if (v) selectHeatType(entry.id, v) }}>
                            <SelectTrigger className="h-8">
                              <SelectValue placeholder="種類を選択" />
                            </SelectTrigger>
                            <SelectContent>
                              {heatTypes.map((h) => (
                                <SelectItem key={h.name} value={h.name}>
                                  <div>
                                    <div>{h.name}</div>
                                    <div className="text-[10px] text-muted-foreground">{h.description} — {h.factor} {h.factorUnit}</div>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Input value={entry.name !== entry.heatType ? entry.name : ''} onChange={(e) => updateHeat(entry.id, 'name', e.target.value || entry.heatType)} placeholder="用途" className="h-8" />
                        </TableCell>
                        <TableCell>
                          <Input type="number" value={entry.usage || ''} onChange={(e) => updateHeat(entry.id, 'usage', Number(e.target.value))} placeholder="0" className="h-8 text-right" />
                        </TableCell>
                        <TableCell className="text-right text-sm text-muted-foreground">
                          {entry.emissionFactor > 0 && entry.emissionFactor}
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {result && result.emission_tCO2eq > 0 ? result.emission_tCO2eq.toLocaleString('ja-JP', { maximumFractionDigits: 4 }) : '—'}
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm" onClick={() => removeHeat(entry.id)} className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive">×</Button>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                  {data.heat.length === 0 && (
                    <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">「行を追加」で入力を開始</TableCell></TableRow>
                  )}
                </TableBody>
                <TableFooter>
                  <TableRow>
                    <TableCell colSpan={4} className="font-bold">熱 小計</TableCell>
                    <TableCell className="text-right font-mono font-bold">{heatTotal.toLocaleString('ja-JP', { maximumFractionDigits: 4 })}</TableCell>
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
