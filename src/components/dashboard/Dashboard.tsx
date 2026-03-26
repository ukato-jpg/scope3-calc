import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table, TableBody, TableCell, TableHead,
  TableHeader, TableRow, TableFooter,
} from '@/components/ui/table'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { useAppStore } from '@/store/app-store'
import { useCategoryStore } from '@/store/category-store'
import { aggregateAll } from '@/engine/aggregator'
import { CATEGORIES } from '@/lib/constants'

function formatNumber(n: number, decimals = 2): string {
  return n.toLocaleString('ja-JP', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
}

const CHART_COLORS = [
  '#1B4D3E', '#2d7a5f', '#3da87a', '#8BC34A', '#a8d56b',
  '#c4e78d', '#F28C28', '#f5a656', '#f7c084', '#888888',
  '#6b7b8d', '#4e6e5d', '#335544', '#557766', '#779988',
]

export function Dashboard() {
  const settings = useAppStore((s) => s.settings)
  const data = useCategoryStore((s) => s.data)
  const navigate = useNavigate()

  const summary = useMemo(() => {
    const lookupFn = () => undefined
    return aggregateAll(data, lookupFn, settings.gwpGeneration, settings.scope1Emission, settings.scope2Emission)
  }, [data, settings])

  const barData = useMemo(() =>
    summary.categories
      .filter((c) => c.emission > 0)
      .map((c) => ({
        name: `Cat.${c.categoryId}`,
        emission: Math.round(c.emission * 100) / 100,
        fullName: CATEGORIES[c.categoryId - 1].fullName,
      })),
    [summary],
  )

  const pieData = useMemo(() => {
    const items = [
      { name: 'Scope 1', value: settings.scope1Emission },
      { name: 'Scope 2', value: settings.scope2Emission },
      { name: 'Scope 3', value: summary.scope3Total },
    ].filter((d) => d.value > 0)
    return items
  }, [settings, summary])

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">集計結果</h1>

      {/* Scope 1,2,3 サマリーカード */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Scope 1', value: settings.scope1Emission, color: '#1B4D3E' },
          { label: 'Scope 2', value: settings.scope2Emission, color: '#2d7a5f' },
          { label: 'Scope 3', value: summary.scope3Total, color: '#8BC34A' },
          { label: '合計', value: summary.grandTotal, color: '#333333' },
        ].map((item) => (
          <Card key={item.label}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">{item.label}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" style={{ color: item.color }}>
                {formatNumber(item.value)}
              </div>
              <div className="text-xs text-muted-foreground">t-CO2eq</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* グラフ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 棒グラフ: カテゴリ別排出量 */}
        {barData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">カテゴリ別排出量</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={barData} layout="vertical" margin={{ left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={50} />
                  <Tooltip
                    formatter={(value) => [`${formatNumber(Number(value))} t-CO2eq`, '排出量']}
                    labelFormatter={(label) => {
                      const item = barData.find((d) => d.name === String(label))
                      return item ? `${label} ${item.fullName}` : String(label)
                    }}
                  />
                  <Bar dataKey="emission" radius={[0, 4, 4, 0]}>
                    {barData.map((_, idx) => (
                      <Cell key={idx} fill={CHART_COLORS[idx % CHART_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* 円グラフ: Scope構成 */}
        {pieData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Scope構成比</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(1)}%`}
                    labelLine={false}
                  >
                    {pieData.map((_, idx) => (
                      <Cell key={idx} fill={['#1B4D3E', '#8BC34A', '#F28C28'][idx]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `${formatNumber(Number(value))} t-CO2eq`} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Scope3 カテゴリ別一覧表 */}
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
                  <TableRow
                    key={cat.categoryId}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => navigate(`/category/${cat.categoryId}`)}
                  >
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
