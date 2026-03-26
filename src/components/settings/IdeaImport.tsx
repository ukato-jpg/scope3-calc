import { useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useAppStore } from '@/store/app-store'
import { importBulk, getCount, clearAll } from '@/db/idea-repository'
import { parseIdeaFile } from '@/lib/file-io'

export function IdeaImport() {
  const ideaDbImported = useAppStore((s) => s.ideaDbImported)
  const ideaDbCount = useAppStore((s) => s.ideaDbCount)
  const setIdeaDbStatus = useAppStore((s) => s.setIdeaDbStatus)

  const [importing, setImporting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState(false)

  const handleFile = useCallback(async (file: File) => {
    setImporting(true)
    setError(null)
    try {
      const records = await parseIdeaFile(file)
      if (records.length === 0) {
        setError('排出原単位データが見つかりませんでした。IDEA Ver.3.5のExcelファイルを選択してください。')
        setImporting(false)
        return
      }
      await importBulk(records)
      const count = await getCount()
      setIdeaDbStatus(true, count)
    } catch (e) {
      setError(`インポートエラー: ${e instanceof Error ? e.message : String(e)}`)
    } finally {
      setImporting(false)
    }
  }, [setIdeaDbStatus])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }, [handleFile])

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
    e.target.value = ''
  }, [handleFile])

  const handleClear = useCallback(async () => {
    if (!window.confirm('IDEA排出原単位データを削除しますか？')) return
    await clearAll()
    setIdeaDbStatus(false, 0)
  }, [setIdeaDbStatus])

  return (
    <Card>
      <CardHeader>
        <CardTitle>IDEA データベース</CardTitle>
        <CardDescription>
          IDEA Ver.3.5の排出原単位データベースをExcelファイルからインポートします。
          インポートしたデータはブラウザに保存され、各カテゴリの計算に使用されます。
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {ideaDbImported ? (
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="size-3 rounded-full bg-green-500" />
              <span className="text-sm font-medium">インポート済み</span>
              <span className="text-sm text-muted-foreground">
                {ideaDbCount.toLocaleString()} レコード
              </span>
            </div>
            <div className="flex gap-2">
              <label className="cursor-pointer inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium border border-input bg-background shadow-xs hover:bg-accent hover:text-accent-foreground h-8 px-3">
                <input type="file" accept=".xlsx,.xls,.csv" onChange={handleFileInput} className="hidden" />
                再インポート
              </label>
              <Button variant="destructive" size="sm" onClick={handleClear}>
                データ削除
              </Button>
            </div>
          </div>
        ) : (
          <div
            onDrop={handleDrop}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            className={`rounded-lg border-2 border-dashed p-8 text-center transition-colors ${
              dragOver ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'
            }`}
          >
            {importing ? (
              <div className="text-sm text-muted-foreground">インポート中...</div>
            ) : (
              <>
                <div className="text-sm text-muted-foreground mb-3">
                  IDEA Ver.3.5のExcelファイルをドラッグ&ドロップ
                </div>
                <label className="cursor-pointer inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium border border-input bg-background shadow-xs hover:bg-accent hover:text-accent-foreground h-8 px-3">
                  <input type="file" accept=".xlsx,.xls,.csv" onChange={handleFileInput} className="hidden" />
                  ファイルを選択
                </label>
              </>
            )}
          </div>
        )}

        {error && (
          <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
            {error}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
