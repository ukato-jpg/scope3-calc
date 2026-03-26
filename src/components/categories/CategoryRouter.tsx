import { useParams } from 'react-router-dom'
import { CATEGORIES } from '@/lib/constants'
import { Cat15Page } from './Cat15Page'

/** 未実装カテゴリのプレースホルダ */
function CategoryPlaceholder({ id }: { id: number }) {
  const cat = CATEGORIES.find((c) => c.id === id)
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">
        カテゴリ{id}. {cat?.fullName}
      </h1>
      <p className="text-muted-foreground">{cat?.description}</p>
      <div className="rounded-lg border border-dashed p-12 text-center text-muted-foreground">
        入力画面は実装中です
      </div>
    </div>
  )
}

export function CategoryRouter() {
  const { id } = useParams<{ id: string }>()
  const categoryId = Number(id)

  switch (categoryId) {
    case 15:
      return <Cat15Page />
    default:
      return <CategoryPlaceholder id={categoryId} />
  }
}
