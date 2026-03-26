import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { useAppStore } from '@/store/app-store'

export function SettingsPage() {
  const settings = useAppStore((s) => s.settings)
  const updateSettings = useAppStore((s) => s.updateSettings)
  const ideaDbImported = useAppStore((s) => s.ideaDbImported)
  const ideaDbCount = useAppStore((s) => s.ideaDbCount)

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-2xl font-bold">設定</h1>

      <Card>
        <CardHeader>
          <CardTitle>基本設定</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium">組織名</label>
            <Input
              value={settings.organizationName}
              onChange={(e) => updateSettings({ organizationName: e.target.value })}
              placeholder="組織名を入力"
              className="mt-1"
            />
          </div>
          <div>
            <label className="text-sm font-medium">報告年度</label>
            <Input
              type="number"
              value={settings.reportingYear}
              onChange={(e) => updateSettings({ reportingYear: Number(e.target.value) })}
              className="mt-1 w-32"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Scope 1, 2 排出量</CardTitle>
          <CardDescription>集計結果の算出に使用します</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium">Scope 1 排出量 [t-CO2eq]</label>
            <Input
              type="number"
              value={settings.scope1Emission || ''}
              onChange={(e) => updateSettings({ scope1Emission: Number(e.target.value) })}
              placeholder="0"
              className="mt-1 w-48"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Scope 2 排出量 [t-CO2eq]</label>
            <Input
              type="number"
              value={settings.scope2Emission || ''}
              onChange={(e) => updateSettings({ scope2Emission: Number(e.target.value) })}
              placeholder="0"
              className="mt-1 w-48"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>IDEA データベース</CardTitle>
          <CardDescription>
            IDEA Ver.3.5の排出原単位データベースをインポートします
          </CardDescription>
        </CardHeader>
        <CardContent>
          {ideaDbImported ? (
            <div className="text-sm">
              <span className="text-green-600 font-medium">インポート済み</span>
              <span className="text-muted-foreground ml-2">
                ({ideaDbCount.toLocaleString()} レコード)
              </span>
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">
              未インポート — Phase 5で実装予定
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
