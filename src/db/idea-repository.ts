import type { IdeaRecord } from '@/types/idea'
import ideaRaw from '@/data/idea-database.json'

type IdeaCompact = { c: string; n: string; co: string; d: string; u: string; f: number }

/** 埋め込みIDEAデータを展開 */
const ideaRecords: IdeaRecord[] = (ideaRaw as IdeaCompact[]).map((r) => ({
  productCode: r.c,
  productName: r.n,
  country: r.co,
  dbCategory: r.d,
  baseFlow: 1,
  unit: r.u,
  emissionFactor: r.f,
}))

/** コード→レコードのインデックス（O(1)検索） */
const codeIndex = new Map<string, IdeaRecord>(
  ideaRecords.map((r) => [r.productCode, r]),
)

/** IDEA製品コードで完全一致検索 */
export function findByCode(code: string): IdeaRecord | undefined {
  return codeIndex.get(code)
}

/** 製品名で部分一致検索 */
export function searchByName(query: string, limit = 20): IdeaRecord[] {
  if (!query) return []
  const lower = query.toLowerCase()
  const results: IdeaRecord[] = []
  for (const r of ideaRecords) {
    if (r.productName.toLowerCase().includes(lower)) {
      results.push(r)
      if (results.length >= limit) break
    }
  }
  return results
}

/** 製品コードで部分一致検索 */
export function searchByCode(query: string, limit = 20): IdeaRecord[] {
  if (!query) return []
  const lower = query.toLowerCase()
  const results: IdeaRecord[] = []
  for (const r of ideaRecords) {
    if (r.productCode.toLowerCase().includes(lower)) {
      results.push(r)
      if (results.length >= limit) break
    }
  }
  return results
}

/** レコード数 */
export function getCount(): number {
  return ideaRecords.length
}

/** 全レコード取得 */
export function getAll(): IdeaRecord[] {
  return ideaRecords
}
