'use client'

import { useCallback } from 'react'
import { useSettingsStore } from '@/store/settingsStore'

export function useSe(src: string) {
  // seVolume を購読（依存配列には含めず getState() で最新値を取得）
  useSettingsStore((s) => s.seVolume)

  const play = useCallback(() => {
    const vol = useSettingsStore.getState().seVolume
    if (vol === 0) return
    const audio = new Audio(src)
    audio.volume = vol / 100
    audio.play().catch(() => {})
  }, [src])

  return { play }
}
