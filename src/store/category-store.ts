import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { nanoid } from 'nanoid'
import type { AllCategoryData, Scope1Entry, Scope2Data } from '@/types/categories'

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

function createEmptyScope2(): Scope2Data {
  return { electricity: [], heat: [] }
}

type CategoryState = {
  data: AllCategoryData
  scope1: Scope1Entry[]
  scope2: Scope2Data
  updateCategory: <K extends keyof AllCategoryData>(key: K, value: AllCategoryData[K]) => void
  updateScope1: (entries: Scope1Entry[]) => void
  updateScope2: (data: Scope2Data) => void
  resetAll: () => void
}

export const useCategoryStore = create<CategoryState>()(
  persist(
    (set) => ({
      data: createEmptyData(),
      scope1: [],
      scope2: createEmptyScope2(),
      updateCategory: (key, value) =>
        set((state) => ({ data: { ...state.data, [key]: value } })),
      updateScope1: (entries) => set({ scope1: entries }),
      updateScope2: (data) => set({ scope2: data }),
      resetAll: () => set({ data: createEmptyData(), scope1: [], scope2: createEmptyScope2() }),
    }),
    { name: 'scope3-category-data' },
  ),
)

/** 新しいIDを生成 */
export function newId(): string {
  return nanoid(10)
}
