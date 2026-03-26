import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { AppSettings } from '@/types/common'
import { DEFAULT_SETTINGS } from '@/lib/constants'

type AppState = {
  settings: AppSettings
  ideaDbImported: boolean
  ideaDbCount: number
  updateSettings: (partial: Partial<AppSettings>) => void
  setIdeaDbStatus: (imported: boolean, count: number) => void
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      settings: { ...DEFAULT_SETTINGS },
      ideaDbImported: false,
      ideaDbCount: 0,
      updateSettings: (partial) =>
        set((state) => ({ settings: { ...state.settings, ...partial } })),
      setIdeaDbStatus: (imported, count) =>
        set({ ideaDbImported: imported, ideaDbCount: count }),
    }),
    { name: 'scope3-app-settings' },
  ),
)
