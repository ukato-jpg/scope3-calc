import { useParams } from 'react-router-dom'
import { CATEGORIES } from '@/lib/constants'
import { Cat1Page } from './Cat1Page'
import { Cat2Page } from './Cat2Page'
import { Cat3Page } from './Cat3Page'
import { Cat4Page } from './Cat4Page'
import { Cat5Page } from './Cat5Page'
import { Cat6Page } from './Cat6Page'
import { Cat7Page } from './Cat7Page'
import { Cat8Page } from './Cat8Page'
import { Cat9Page } from './Cat9Page'
import { Cat10Page } from './Cat10Page'
import { Cat11Page } from './Cat11Page'
import { Cat12Page } from './Cat12Page'
import { Cat13Page } from './Cat13Page'
import { Cat14Page } from './Cat14Page'
import { Cat15Page } from './Cat15Page'

const CATEGORY_PAGES: Record<number, React.ComponentType> = {
  1: Cat1Page,
  2: Cat2Page,
  3: Cat3Page,
  4: Cat4Page,
  5: Cat5Page,
  6: Cat6Page,
  7: Cat7Page,
  8: Cat8Page,
  9: Cat9Page,
  10: Cat10Page,
  11: Cat11Page,
  12: Cat12Page,
  13: Cat13Page,
  14: Cat14Page,
  15: Cat15Page,
}

export function CategoryRouter() {
  const { id } = useParams<{ id: string }>()
  const categoryId = Number(id)
  const PageComponent = CATEGORY_PAGES[categoryId]

  if (!PageComponent) {
    const cat = CATEGORIES.find((c) => c.id === categoryId)
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">カテゴリ{categoryId}. {cat?.fullName}</h1>
        <div className="rounded-lg border border-dashed p-12 text-center text-muted-foreground">
          カテゴリが見つかりません
        </div>
      </div>
    )
  }

  return <PageComponent />
}
