import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface SettingsState {
  bgmVolume: number  // 0-100
  setBgmVolume: (v: number) => void
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      bgmVolume: 70,
      setBgmVolume: (v) => set({ bgmVolume: v }),
    }),
    { name: 'word-solitaire-settings' }
  )
)
