'use client'

import { useEffect, useRef } from 'react'
import { useSettingsStore } from '@/store/settingsStore'

export function useBgm(src: string) {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const bgmVolume = useSettingsStore((s) => s.bgmVolume)

  // マウント時に音声を生成して再生開始
  useEffect(() => {
    const audio = new Audio(src)
    audio.loop = true
    audio.volume = useSettingsStore.getState().bgmVolume / 100
    audioRef.current = audio

    // 自動再生を試みる（ブラウザのAutoplay Policy対策）
    const startPlay = () => audio.play().catch(() => {})
    const promise = audio.play()
    if (promise !== undefined) {
      promise.catch(() => {
        // ユーザー操作後に再生
        document.addEventListener('click', startPlay, { once: true })
        document.addEventListener('touchstart', startPlay, { once: true })
      })
    }

    return () => {
      audio.pause()
      audio.src = ''
      document.removeEventListener('click', startPlay)
      document.removeEventListener('touchstart', startPlay)
    }
  }, [src])

  // 音量変更をリアルタイムで反映
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = bgmVolume / 100
    }
  }, [bgmVolume])
}
