import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { getCount } from '@/db/idea-repository'

export function IdeaImport() {
  const count = getCount()

  return (
    <Card>
      <CardHeader>
        <CardTitle>IDEA データベース</CardTitle>
        <CardDescription>
          IDEA Ver.3.5.1の排出原単位データベース（AR6 GWP 100a without LULUCF）
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-3">
          <div className="size-3 rounded-full bg-green-500" />
          <span className="text-sm font-medium">アプリに組み込み済み</span>
          <span className="text-sm text-muted-foreground">
            {count.toLocaleString()} レコード
          </span>
        </div>
      </CardContent>
    </Card>
  )
}
