import * as XLSX from 'xlsx'
import type { IdeaRecord } from '@/types/idea'

/**
 * IDEA Ver.3.5のExcel/CSVファイルを解析してIdeaRecordの配列を返す
 * 期待する列: A=製品コード, B=製品名, C=国, D=DB区分, E=基準フロー, F=単位, G=排出原単位(kg-CO2eq)
 */
export async function parseIdeaFile(file: File): Promise<IdeaRecord[]> {
  const buffer = await file.arrayBuffer()
  const workbook = XLSX.read(buffer)
  const sheetName = workbook.SheetNames[0]
  const sheet = workbook.Sheets[sheetName]
  const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1 })

  // ヘッダー行を探す（「IDEA製品コード」または「製品コード」を含む行）
  let headerRowIdx = -1
  for (let i = 0; i < Math.min(rows.length, 10); i++) {
    const row = rows[i]
    if (row && Array.isArray(row) && row.some((cell) => String(cell).includes('製品コード') || String(cell).includes('productCode'))) {
      headerRowIdx = i
      break
    }
  }

  const dataStartIdx = headerRowIdx >= 0 ? headerRowIdx + 1 : 1
  const records: IdeaRecord[] = []

  for (let i = dataStartIdx; i < rows.length; i++) {
    const row = rows[i]
    if (!row || !Array.isArray(row) || !row[0]) continue

    const emissionFactor = Number(row[6])
    if (isNaN(emissionFactor) || emissionFactor === 0) continue

    records.push({
      productCode: String(row[0]),
      productName: String(row[1] || ''),
      country: String(row[2] || ''),
      dbCategory: String(row[3] || ''),
      baseFlow: Number(row[4]) || 1,
      unit: String(row[5] || ''),
      emissionFactor,
    })
  }

  return records
}

/**
 * 全カテゴリデータをJSONとしてエクスポート
 */
export function exportDataAsJson(data: unknown, filename: string): void {
  const json = JSON.stringify(data, null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  downloadBlob(blob, filename)
}

/**
 * JSONファイルを読み込んで解析
 */
export async function importJsonFile<T>(file: File): Promise<T> {
  const text = await file.text()
  return JSON.parse(text) as T
}

/**
 * 集計結果をExcelファイルとしてエクスポート
 */
export function exportSummaryAsExcel(
  summaryRows: { category: string; name: string; emission: number; ratio: number }[],
  filename: string,
): void {
  const wb = XLSX.utils.book_new()
  const wsData = [
    ['カテゴリ', '名称', '排出量 [t-CO2eq]', '構成比 [%]'],
    ...summaryRows.map((r) => [r.category, r.name, r.emission, r.ratio]),
  ]
  const ws = XLSX.utils.aoa_to_sheet(wsData)
  XLSX.utils.book_append_sheet(wb, ws, '集計結果')
  const buf = XLSX.write(wb, { type: 'array', bookType: 'xlsx' })
  const blob = new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  downloadBlob(blob, filename)
}

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
