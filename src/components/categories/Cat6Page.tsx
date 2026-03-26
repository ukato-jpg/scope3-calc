import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useCategoryStore, newId } from '@/store/category-store'
import { calculateCat6 } from '@/engine/cat6'
import { sumEmissions } from '@/engine/common'
import { getAllTransportFactors } from '@/engine/lookup'
import type { Cat6Data, Cat6TransportEntry, Cat6AccommodationEntry, Cat6EmployeeEntry } from '@/types/categories'

const transportFactorList = getAllTransportFactors()

function createTransportEmpty(): Cat6TransportEntry {
  return { id: newId(), name: '', transportType: '', amount: 0 }
}

function createAccommodationEmpty(): Cat6AccommodationEntry {
  return { id: newId(), name: '', nights: 0 }
}

function createEmployeeEmpty(): Cat6EmployeeEntry {
  return { id: newId(), name: '', employeeCount: 0 }
}

export function Cat6Page() {
  const data = useCategoryStore((s) => s.data.cat6)
  const update = useCategoryStore((s) => s.updateCategory)

  const results = useMemo(() => calculateCat6(data), [data])

  const transportTotal = useMemo(() => sumEmissions(results.transport), [results.transport])
  const accommodationTotal = useMemo(() => sumEmissions(results.accommodation), [results.accommodation])
  const employeeTotal = useMemo(() => sumEmissions(results.employee), [results.employee])
  const grandTotal = transportTotal + accommodationTotal + employeeTotal

  const transportResultMap = useMemo(
    () => new Map(results.transport.map((r) => [r.rowId, r])),
    [results.transport],
  )
  const accommodationResultMap = useMemo(
    () => new Map(results.accommodation.map((r) => [r.rowId, r])),
    [results.accommodation],
  )
  const employeeResultMap = useMemo(
    () => new Map(results.employee.map((r) => [r.rowId, r])),
    [results.employee],
  )

  function setData(patch: Partial<Cat6Data>) {
    update('cat6', { ...data, ...patch })
  }

  // --- Transport ---
  function addTransportRow() {
    setData({ transport: [...data.transport, createTransportEmpty()] })
  }
  function removeTransportRow(id: string) {
    setData({ transport: data.transport.filter((e) => e.id !== id) })
  }
  function updateTransportRow(id: string, field: keyof Cat6TransportEntry, value: string | number) {
    setData({
      transport: data.transport.map((e) => (e.id === id ? { ...e, [field]: value } : e)),
    })
  }

  // --- Accommodation ---
  function addAccommodationRow() {
    setData({ accommodation: [...data.accommodation, createAccommodationEmpty()] })
  }
  function removeAccommodationRow(id: string) {
    setData({ accommodation: data.accommodation.filter((e) => e.id !== id) })
  }
  function updateAccommodationRow(id: string, field: keyof Cat6AccommodationEntry, value: string | number) {
    setData({
      accommodation: data.accommodation.map((e) => (e.id === id ? { ...e, [field]: value } : e)),
    })
  }

  // --- Employee ---
  function addEmployeeRow() {
    setData({ employee: [...data.employee, createEmployeeEmpty()] })
  }
  function removeEmployeeRow(id: string) {
    setData({ employee: data.employee.filter((e) => e.id !== id) })
  }
  function updateEmployeeRow(id: string, field: keyof Cat6EmployeeEntry, value: string | number) {
    setData({
      employee: data.employee.map((e) => (e.id === id ? { ...e, [field]: value } : e)),
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">カテゴリ6. 出張</h1>
        <p className="text-muted-foreground mt-1">
          従業員の出張に伴う交通・宿泊の排出量を算定
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>算出方法</CardTitle>
          <CardDescription>
            交通費: 交通費[円] × 排出原単位[kgCO2/円] ÷ 10³ ／
            宿泊: 宿泊数[泊] × 排出原単位[kgCO2/泊] ÷ 10³ ／
            従業員数: 従業員数[人] × 排出原単位[tCO2/人・年]
          </CardDescription>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>合計排出量</CardTitle>
            <CardDescription className="mt-1">3セクションの合計</CardDescription>
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
          <TabsTrigger value="accommodation">
            宿泊日数
            <span className="ml-1 text-xs text-muted-foreground">
              ({accommodationTotal.toLocaleString('ja-JP', { maximumFractionDigits: 2 })})
            </span>
          </TabsTrigger>
          <TabsTrigger value="employee">
            従業員数
            <span className="ml-1 text-xs text-muted-foreground">
              ({employeeTotal.toLocaleString('ja-JP', { maximumFractionDigits: 2 })})
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
                                  {tf.name}
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

        {/* セクション2: 宿泊日数 */}
        <TabsContent value="accommodation">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>宿泊日数</CardTitle>
              <Button size="sm" onClick={addAccommodationRow}>
                行を追加
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-64">名称</TableHead>
                    <TableHead className="w-36 text-right">宿泊数 [泊]</TableHead>
                    <TableHead className="w-40 text-right">排出量 [t-CO2eq]</TableHead>
                    <TableHead className="w-16" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.accommodation.map((entry) => {
                    const result = accommodationResultMap.get(entry.id)
                    return (
                      <TableRow key={entry.id}>
                        <TableCell>
                          <Input
                            value={entry.name}
                            onChange={(e) => updateAccommodationRow(entry.id, 'name', e.target.value)}
                            placeholder="名称"
                            className="h-8"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            value={entry.nights || ''}
                            onChange={(e) =>
                              updateAccommodationRow(entry.id, 'nights', Number(e.target.value))
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
                            onClick={() => removeAccommodationRow(entry.id)}
                            className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                          >
                            ×
                          </Button>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                  {data.accommodation.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                        データがありません。「行を追加」ボタンで入力を開始してください。
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
                <TableFooter>
                  <TableRow>
                    <TableCell colSpan={2} className="font-bold">小計</TableCell>
                    <TableCell className="text-right font-mono font-bold">
                      {accommodationTotal.toLocaleString('ja-JP', { maximumFractionDigits: 4 })}
                    </TableCell>
                    <TableCell />
                  </TableRow>
                </TableFooter>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* セクション3: 従業員数 */}
        <TabsContent value="employee">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>従業員数</CardTitle>
              <Button size="sm" onClick={addEmployeeRow}>
                行を追加
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-64">名称</TableHead>
                    <TableHead className="w-36 text-right">従業員数 [人]</TableHead>
                    <TableHead className="w-40 text-right">排出量 [t-CO2eq]</TableHead>
                    <TableHead className="w-16" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.employee.map((entry) => {
                    const result = employeeResultMap.get(entry.id)
                    return (
                      <TableRow key={entry.id}>
                        <TableCell>
                          <Input
                            value={entry.name}
                            onChange={(e) => updateEmployeeRow(entry.id, 'name', e.target.value)}
                            placeholder="名称"
                            className="h-8"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            value={entry.employeeCount || ''}
                            onChange={(e) =>
                              updateEmployeeRow(entry.id, 'employeeCount', Number(e.target.value))
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
                            onClick={() => removeEmployeeRow(entry.id)}
                            className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                          >
                            ×
                          </Button>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                  {data.employee.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                        データがありません。「行を追加」ボタンで入力を開始してください。
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
                <TableFooter>
                  <TableRow>
                    <TableCell colSpan={2} className="font-bold">小計</TableCell>
                    <TableCell className="text-right font-mono font-bold">
                      {employeeTotal.toLocaleString('ja-JP', { maximumFractionDigits: 4 })}
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
