import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table, TableBody, TableCell, TableHead,
  TableHeader, TableRow, TableFooter,
} from '@/components/ui/table'
import { useAppStore } from '@/store/app-store'
import { useCategoryStore } from '@/store/category-store'
import { aggregateAll } from '@/engine/aggregator'
import { CATEGORIES } from '@/lib/constants'

function formatNumber(n: number, decimals = 2): string {
  return n.toLocaleString('ja-JP', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
}

export function Dashboard() {
  const settings = useAppStore((s) => s.settings)
  const data = useCategoryStore((s) => s.data)

  const summary = useMemo(() => {
    // IDEA DBがない場合はダミーのlookup（常にundefined）
    const lookupFn = () => undefined
    return aggregateAll(data, lookupFn, settings.gwpGeneration, settings.scope1Emission, settings.scope2Emission)
  }, [data, settings])

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">集計結果</h1>

      {/* Scope 1,2,3 サマリー */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Scope 1</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(settings.scope1Emission)}</div>
            <div className="text-xs text-muted-foreground">t-CO2eq</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Scope 2</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(settings.scope2Emission)}</div>
            <div className="text-xs text-muted-foreground">t-CO2eq</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Scope 3</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(summary.scope3Total)}</div>
            <div className="text-xs text-muted-foreground">t-CO2eq</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">合計</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(summary.grandTotal)}</div>
            <div className="text-xs text-muted-foreground">t-CO2eq</div>
          </CardContent>
        </Card>
      </div>

      {/* Scope3 カテゴリ別一覧 */}
      <Card>
        <CardHeader>
          <CardTitle>Scope3 カテゴリ別排出量</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-24">カテゴリ</TableHead>
                <TableHead>名称</TableHead>
                <TableHead className="text-right w-40">排出量 [t-CO2eq]</TableHead>
                <TableHead className="text-right w-24">構成比 [%]</TableHead>
                <TableHead className="text-right w-20">エラー</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {summary.categories.map((cat) => {
                const info = CATEGORIES[cat.categoryId - 1]
                const ratio = summary.scope3Total > 0
                  ? (cat.emission / summary.scope3Total) * 100
                  : 0
                return (
                  <TableRow key={cat.categoryId}>
                    <TableCell className="font-medium">Cat.{cat.categoryId}</TableCell>
                    <TableCell>{info.fullName}</TableCell>
                    <TableCell className="text-right font-mono">
                      {formatNumber(cat.emission)}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {formatNumber(ratio)}
                    </TableCell>
                    <TableCell className="text-right">
                      {cat.errorCount > 0 && (
                        <span className="text-destructive font-medium">{cat.errorCount}</span>
                      )}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
            <TableFooter>
              <TableRow>
                <TableCell colSpan={2} className="font-bold">Scope 3 合計</TableCell>
                <TableCell className="text-right font-mono font-bold">
                  {formatNumber(summary.scope3Total)}
                </TableCell>
                <TableCell className="text-right font-mono font-bold">100.00</TableCell>
                <TableCell />
              </TableRow>
            </TableFooter>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
