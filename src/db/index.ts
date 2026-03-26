import Dexie, { type EntityTable } from 'dexie'
import type { IdeaRecord } from '@/types/idea'

/** IDEA排出原単位のIndexedDBテーブル */
export type IdeaRecordRow = IdeaRecord & { id?: number }

class Scope3Database extends Dexie {
  ideaRecords!: EntityTable<IdeaRecordRow, 'id'>

  constructor() {
    super('scope3-calc')
    this.version(1).stores({
      ideaRecords: '++id, productCode, productName',
    })
  }
}

export const db = new Scope3Database()
