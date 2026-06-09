import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface SettingsState {
  bgmVolume: number  // 0-100
  seVolume: number   // 0-100
  setBgmVolume: (v: number) => void
  setSeVolume: (v: number) => void
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      bgmVolume: 70,
      seVolume: 80,
      setBgmVolume: (v) => set({ bgmVolume: v }),
      setSeVolume: (v) => set({ seVolume: v }),
    }),
    { name: 'word-solitaire-settings' }
  )
)
