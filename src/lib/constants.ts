import type { CategoryInfo } from '@/types/common'

export const CATEGORIES: CategoryInfo[] = [
  { id: 1, name: 'Cat.1', fullName: '購入した製品・サービス', scope: 'scope3', usesIdea: true, description: '自社が購入・取得した製品またはサービスの資源採取段階から製造段階までの排出' },
  { id: 2, name: 'Cat.2', fullName: '資本財', scope: 'scope3', usesIdea: false, description: '自社が購入・取得した資本財の建設・製造段階の排出' },
  { id: 3, name: 'Cat.3', fullName: 'Scope1,2に含まれない燃料及びエネルギー関連活動', scope: 'scope3', usesIdea: true, description: '購入した燃料・エネルギーの上流工程（採掘、精製等）の排出' },
  { id: 4, name: 'Cat.4', fullName: '輸送、配送（上流）', scope: 'scope3', usesIdea: true, description: '購入した製品・サービスの上流の輸送、自社の調達物流の排出' },
  { id: 5, name: 'Cat.5', fullName: '事業から出る廃棄物', scope: 'scope3', usesIdea: true, description: '自社が排出した廃棄物の処理・輸送に伴う排出' },
  { id: 6, name: 'Cat.6', fullName: '出張', scope: 'scope3', usesIdea: false, description: '従業員の出張に伴う排出' },
  { id: 7, name: 'Cat.7', fullName: '雇用者の通勤', scope: 'scope3', usesIdea: false, description: '従業員の通勤に伴う排出' },
  { id: 8, name: 'Cat.8', fullName: 'リース資産（上流）', scope: 'scope3', usesIdea: true, description: '自社がリースする資産の稼働に伴う排出' },
  { id: 9, name: 'Cat.9', fullName: '輸送、配送（下流）', scope: 'scope3', usesIdea: true, description: '販売した製品の下流の輸送に伴う排出' },
  { id: 10, name: 'Cat.10', fullName: '販売した製品の加工', scope: 'scope3', usesIdea: true, description: '販売した中間製品の加工に伴う排出' },
  { id: 11, name: 'Cat.11', fullName: '販売した製品の使用', scope: 'scope3', usesIdea: true, description: '販売した製品の使用時の排出' },
  { id: 12, name: 'Cat.12', fullName: '販売した製品の廃棄', scope: 'scope3', usesIdea: true, description: '販売した製品の廃棄時の処理に伴う排出' },
  { id: 13, name: 'Cat.13', fullName: 'リース資産（下流）', scope: 'scope3', usesIdea: true, description: '他者にリースする資産の稼働に伴う排出' },
  { id: 14, name: 'Cat.14', fullName: 'フランチャイズ', scope: 'scope3', usesIdea: true, description: 'フランチャイズ加盟店の排出' },
  { id: 15, name: 'Cat.15', fullName: '投資', scope: 'scope3', usesIdea: false, description: '投資先のScope1,2排出量に持分比率を乗じた排出' },
]

export const DEFAULT_SETTINGS = {
  organizationName: '',
  reportingYear: new Date().getFullYear() - 1,
  gwpGeneration: 'ar6' as const,
  scope1Emission: 0,
  scope2Emission: 0,
}
