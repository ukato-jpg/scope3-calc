import { db } from './index'
import type { IdeaRecord } from '@/types/idea'

/** IDEA製品コードで完全一致検索 */
export async function findByCode(code: string): Promise<IdeaRecord | undefined> {
  return db.ideaRecords.where('productCode').equals(code).first()
}

/** 製品名でインクリメンタル検索（前方一致） */
export async function searchByName(query: string, limit = 20): Promise<IdeaRecord[]> {
  if (!query) return []
  const lower = query.toLowerCase()
  return db.ideaRecords
    .filter((r) => r.productName.toLowerCase().includes(lower))
    .limit(limit)
    .toArray()
}

/** IDEA DBに一括インポート（既存データは全削除） */
export async function importBulk(records: IdeaRecord[]): Promise<number> {
  await db.ideaRecords.clear()
  return db.ideaRecords.bulkAdd(records) as Promise<number>
}

/** IDEA DBのレコード数を取得 */
export async function getCount(): Promise<number> {
  return db.ideaRecords.count()
}

/** IDEA DBを全削除 */
export async function clearAll(): Promise<void> {
  await db.ideaRecords.clear()
}
