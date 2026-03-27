import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useCategoryStore, newId } from '@/store/category-store'
import { calculateCat7 } from '@/engine/cat7'
import { sumEmissions } from '@/engine/common'
import { getAllTransportFactors, getAllCommutingFactors } from '@/engine/lookup'
import type { Cat7Data, Cat7TransportEntry, Cat7CommutingEntry } from '@/types/categories'

const transportFactorList = getAllTransportFactors()
const commutingFactorList = getAllCommutingFactors()

function createTransportEmpty(): Cat7TransportEntry {
  return { id: newId(), name: '', transportType: '', amount: 0 }
}

function createCommutingEmpty(): Cat7CommutingEntry {
  return { id: newId(), name: '', workStyleCity: '', employeeCount: 0, workDays: 0 }
}

export function Cat7Page() {
  const data = useCategoryStore((s) => s.data.cat7)
  const update = useCategoryStore((s) => s.updateCategory)

  const results = useMemo(() => calculateCat7(data), [data])

  const transportTotal = useMemo(() => sumEmissions(results.transport), [results.transport])
  const commutingTotal = useMemo(() => sumEmissions(results.commuting), [results.commuting])
  const grandTotal = transportTotal + commutingTotal

  const transportResultMap = useMemo(
    () => new Map(results.transport.map((r) => [r.rowId, r])),
    [results.transport],
  )
  const commutingResultMap = useMemo(
    () => new Map(results.commuting.map((r) => [r.rowId, r])),
    [results.commuting],
  )

  function setData(patch: Partial<Cat7Data>) {
    update('cat7', { ...data, ...patch })
  }

  // --- Transport ---
  function addTransportRow() {
    setData({ transport: [...data.transport, createTransportEmpty()] })
  }
  function removeTransportRow(id: string) {
    setData({ transport: data.transport.filter((e) => e.id !== id) })
  }
  function updateTransportRow(id: string, field: keyof Cat7TransportEntry, value: string | number) {
    setData({
      transport: data.transport.map((e) => (e.id === id ? { ...e, [field]: value } : e)),
    })
  }

  // --- Commuting ---
  function addCommutingRow() {
    setData({ commuting: [...data.commuting, createCommutingEmpty()] })
  }
  function removeCommutingRow(id: string) {
    setData({ commuting: data.commuting.filter((e) => e.id !== id) })
  }
  function updateCommutingRow(id: string, field: keyof Cat7CommutingEntry, value: string | number) {
    setData({
      commuting: data.commuting.map((e) => (e.id === id ? { ...e, [field]: value } : e)),
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">カテゴリ7. 雇用者の通勤</h1>
        <p className="text-muted-foreground mt-1">
          従業員の通勤に伴う排出量を算定
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>算出方法</CardTitle>
          <CardDescription>
            交通費: 交通費[円] × 排出原単位[kgCO2/円] ÷ 10³ ／
            通勤: 従業員数[人] × 営業日数[日] × 排出原単位[kgCO2/人・日] ÷ 10³
          </CardDescription>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>合計排出量</CardTitle>
            <CardDescription className="mt-1">2セクションの合計</CardDescription>
          </div>
          <span className="text-2xl font-mono font-bold">
            {grandTotal.toLocaleString('ja-JP', { maximumFractionDigits: 4 })}
            <span className="text-sm font-normal text-muted-foreground ml-1">t-CO2eq</span>
          </span>
        </CardHeader>
      </Card>

      <Tabs defaultValue="transport" className="space-y-4">
        <TabsList>
          <TabsTrigger value="transport">
            交通費支給額
            <span className="ml-1 text-xs text-muted-foreground">
              ({transportTotal.toLocaleString('ja-JP', { maximumFractionDigits: 2 })})
            </span>
          </TabsTrigger>
          <TabsTrigger value="commuting">
            従業員数・営業日数
            <span className="ml-1 text-xs text-muted-foreground">
              ({commutingTotal.toLocaleString('ja-JP', { maximumFractionDigits: 2 })})
            </span>
          </TabsTrigger>
        </TabsList>

        {/* セクション1: 交通費支給額 */}
        <TabsContent value="transport">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>交通費支給額</CardTitle>
              <Button size="sm" onClick={addTransportRow}>
                行を追加
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-48">名称</TableHead>
                    <TableHead className="w-56">交通区分</TableHead>
                    <TableHead className="w-36 text-right">金額 [円]</TableHead>
                    <TableHead className="w-40 text-right">排出量 [t-CO2eq]</TableHead>
                    <TableHead className="w-16" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.transport.map((entry) => {
                    const result = transportResultMap.get(entry.id)
                    return (
                      <TableRow key={entry.id}>
                        <TableCell>
                          <Input
                            value={entry.name}
                            onChange={(e) => updateTransportRow(entry.id, 'name', e.target.value)}
                            placeholder="名称"
                            className="h-8"
                          />
                        </TableCell>
                        <TableCell>
                          <Select
                            value={entry.transportType}
                            onValueChange={(v) => { if (v) updateTransportRow(entry.id, 'transportType', v) }}
                          >
                            <SelectTrigger className="h-8">
                              <SelectValue placeholder="交通区分を選択" />
                            </SelectTrigger>
                            <SelectContent>
                              {transportFactorList.map((tf) => (
                                <SelectItem key={tf.name} value={tf.name}>
                                  <div>
                                    <div>{tf.name}</div>
                                    <div className="text-[10px] text-muted-foreground">{tf.description} — {tf.emissionFactor.toFixed(5)} {tf.unit}</div>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            value={entry.amount || ''}
                            onChange={(e) =>
                              updateTransportRow(entry.id, 'amount', Number(e.target.value))
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
                            onClick={() => removeTransportRow(entry.id)}
                            className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                          >
                            ×
                          </Button>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                  {data.transport.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                        データがありません。「行を追加」ボタンで入力を開始してください。
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
                <TableFooter>
                  <TableRow>
                    <TableCell colSpan={3} className="font-bold">小計</TableCell>
                    <TableCell className="text-right font-mono font-bold">
                      {transportTotal.toLocaleString('ja-JP', { maximumFractionDigits: 4 })}
                    </TableCell>
                    <TableCell />
                  </TableRow>
                </TableFooter>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* セクション2: 従業員数・営業日数 */}
        <TabsContent value="commuting">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>従業員数・営業日数</CardTitle>
              <Button size="sm" onClick={addCommutingRow}>
                行を追加
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-48">名称</TableHead>
                    <TableHead className="w-56">勤務形態-都市区分</TableHead>
                    <TableHead className="w-28 text-right">従業員数 [人]</TableHead>
                    <TableHead className="w-28 text-right">営業日数 [日]</TableHead>
                    <TableHead className="w-40 text-right">排出量 [t-CO2eq]</TableHead>
                    <TableHead className="w-16" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.commuting.map((entry) => {
                    const result = commutingResultMap.get(entry.id)
                    return (
                      <TableRow key={entry.id}>
                        <TableCell>
                          <Input
                            value={entry.name}
                            onChange={(e) => updateCommutingRow(entry.id, 'name', e.target.value)}
                            placeholder="名称"
                            className="h-8"
                          />
                        </TableCell>
                        <TableCell>
                          <Select
                            value={entry.workStyleCity}
                            onValueChange={(v) => { if (v) updateCommutingRow(entry.id, 'workStyleCity', v) }}
                          >
                            <SelectTrigger className="h-8">
                              <SelectValue placeholder="勤務形態-都市区分を選択" />
                            </SelectTrigger>
                            <SelectContent>
                              {commutingFactorList.map((cf) => (
                                <SelectItem key={cf.name} value={cf.name}>
                                  <div>
                                    <div>{cf.name}</div>
                                    <div className="text-[10px] text-muted-foreground">{cf.description} — {cf.emissionFactor.toFixed(4)} {cf.unit}</div>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            value={entry.employeeCount || ''}
                            onChange={(e) =>
                              updateCommutingRow(entry.id, 'employeeCount', Number(e.target.value))
                            }
                            placeholder="0"
                            className="h-8 text-right"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            value={entry.workDays || ''}
                            onChange={(e) =>
                              updateCommutingRow(entry.id, 'workDays', Number(e.target.value))
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
                            onClick={() => removeCommutingRow(entry.id)}
                            className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                          >
                            ×
                          </Button>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                  {data.commuting.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                        データがありません。「行を追加」ボタンで入力を開始してください。
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
                <TableFooter>
                  <TableRow>
                    <TableCell colSpan={4} className="font-bold">小計</TableCell>
                    <TableCell className="text-right font-mono font-bold">
                      {commutingTotal.toLocaleString('ja-JP', { maximumFractionDigits: 4 })}
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
