import { useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useCategoryStore } from '@/store/category-store'
import { useAppStore } from '@/store/app-store'
import { exportDataAsJson, importJsonFile } from '@/lib/file-io'
import type { AllCategoryData } from '@/types/categories'
import type { AppSettings } from '@/types/common'

type ExportData = {
  version: 1
  exportedAt: string
  settings: AppSettings
  categories: AllCategoryData
}

export function DataManagement() {
  const data = useCategoryStore((s) => s.data)
  const settings = useAppStore((s) => s.settings)
  const updateSettings = useAppStore((s) => s.updateSettings)
  const updateCategory = useCategoryStore((s) => s.updateCategory)
  const resetAll = useCategoryStore((s) => s.resetAll)
  const [importing, setImporting] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const handleExport = useCallback(() => {
    const exportData: ExportData = {
      version: 1,
      exportedAt: new Date().toISOString(),
      settings,
      categories: data,
    }
    const date = new Date().toISOString().slice(0, 10)
    exportDataAsJson(exportData, `scope3-data-${date}.json`)
    setMessage({ type: 'success', text: 'データをエクスポートしました' })
  }, [data, settings])

  const handleImport = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setImporting(true)
    setMessage(null)
    try {
      const imported = await importJsonFile<ExportData>(file)
      if (!imported.version || !imported.categories) {
        throw new Error('無効なデータ形式です')
      }
      // 設定を復元
      if (imported.settings) {
        updateSettings(imported.settings)
      }
      // カテゴリデータを復元
      const cats = imported.categories
      for (const key of Object.keys(cats) as (keyof AllCategoryData)[]) {
        updateCategory(key, cats[key])
      }
      setMessage({ type: 'success', text: 'データをインポートしました' })
    } catch (err) {
      setMessage({ type: 'error', text: `インポートエラー: ${err instanceof Error ? err.message : String(err)}` })
    } finally {
      setImporting(false)
      e.target.value = ''
    }
  }, [updateSettings, updateCategory])

  const handleReset = useCallback(() => {
    if (!window.confirm('全てのカテゴリデータを削除しますか？この操作は元に戻せません。')) return
    resetAll()
    setMessage({ type: 'success', text: '全データをリセットしました' })
  }, [resetAll])

  return (
    <Card>
      <CardHeader>
        <CardTitle>データ管理</CardTitle>
        <CardDescription>
          入力データのエクスポート・インポート・リセットができます
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <Button onClick={handleExport} variant="outline" size="sm">
            JSONエクスポート
          </Button>
          <label className="cursor-pointer inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium border border-input bg-background shadow-xs hover:bg-accent hover:text-accent-foreground h-8 px-3">
            <input
              type="file"
              accept=".json"
              onChange={handleImport}
              className="hidden"
              disabled={importing}
            />
            {importing ? 'インポート中...' : 'JSONインポート'}
          </label>
          <Button onClick={handleReset} variant="destructive" size="sm">
            全データリセット
          </Button>
        </div>

        {message && (
          <div className={`text-sm p-3 rounded-md ${
            message.type === 'success'
              ? 'text-green-700 bg-green-50'
              : 'text-destructive bg-destructive/10'
          }`}>
            {message.text}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
