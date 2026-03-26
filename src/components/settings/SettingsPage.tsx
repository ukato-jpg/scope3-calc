import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useAppStore } from '@/store/app-store'
import { IdeaImport } from './IdeaImport'
import { DataManagement } from './DataManagement'
import type { GwpGeneration } from '@/types/common'

export function SettingsPage() {
  const settings = useAppStore((s) => s.settings)
  const updateSettings = useAppStore((s) => s.updateSettings)

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
          <div>
            <label className="text-sm font-medium">GWP世代（Cat.11 GHG直接排出に適用）</label>
            <Select
              value={settings.gwpGeneration}
              onValueChange={(v) => { if (v) updateSettings({ gwpGeneration: v as GwpGeneration }) }}
            >
              <SelectTrigger className="mt-1 w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ar6">AR6 (IPCC 2021)</SelectItem>
                <SelectItem value="ar5">AR5 (IPCC 2013)</SelectItem>
                <SelectItem value="ar4">AR4 (IPCC 2007)</SelectItem>
              </SelectContent>
            </Select>
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

      <IdeaImport />
      <DataManagement />
    </div>
  )
}
