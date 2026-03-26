import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { nanoid } from 'nanoid'
import type { AllCategoryData } from '@/types/categories'

function createEmptyData(): AllCategoryData {
  return {
    cat1: [],
    cat2: [],
    cat3: [],
    cat4: { tonKilo: [], fuel: [], fuelEfficiency: [] },
    cat5: [],
    cat6: { transport: [], accommodation: [], employee: [] },
    cat7: { transport: [], commuting: [] },
    cat8: [],
    cat9: { tonKilo: [], fuel: [], fuelEfficiency: [] },
    cat10: [],
    cat11: { energy: [], fuel: [], ghg: [] },
    cat12: [],
    cat13: [],
    cat14: [],
    cat15: [],
  }
}

type CategoryState = {
  data: AllCategoryData
  updateCategory: <K extends keyof AllCategoryData>(key: K, value: AllCategoryData[K]) => void
  resetAll: () => void
}

export const useCategoryStore = create<CategoryState>()(
  persist(
    (set) => ({
      data: createEmptyData(),
      updateCategory: (key, value) =>
        set((state) => ({ data: { ...state.data, [key]: value } })),
      resetAll: () => set({ data: createEmptyData() }),
    }),
    { name: 'scope3-category-data' },
  ),
)

/** 新しいIDを生成 */
export function newId(): string {
  return nanoid(10)
}
