'use client'

import React, { useEffect } from 'react'
import { useParams } from 'next/navigation'
import { fetchStageDetail } from '@/lib/api'
import { useGameStore } from '@/store/gameStore'
import { GameContainer } from '@/components/game/GameContainer'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { Button } from '@/components/ui/Button'
import { useRouter } from 'next/navigation'

export default function PlayPage() {
  const params = useParams()
  const router = useRouter()
  const stageId = Number(params.stageId)

  const { initGame, isLoading, error, setLoading, setError } = useGameStore()
  const gameState = useGameStore((s) => s.gameState)

  useEffect(() => {
    if (!stageId || isNaN(stageId)) {
      setError('ステージIDが不正です')
      return
    }

    setLoading(true)
    setError(null)

    fetchStageDetail(stageId)
      .then((stageData) => {
        initGame(stageData)
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : 'ステージの読み込みに失敗しました')
      })
      .finally(() => {
        setLoading(false)
      })
  }, [stageId])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-dvh">
        <LoadingSpinner size="lg" message="ステージを準備中..." />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-dvh gap-4 px-4">
        <p className="text-red-300 text-center">{error}</p>
        <Button variant="secondary" onClick={() => router.push('/')}>
          ホームへ戻る
        </Button>
      </div>
    )
  }

  if (!gameState) {
    return (
      <div className="flex items-center justify-center min-h-dvh">
        <LoadingSpinner message="初期化中..." />
      </div>
    )
  }

  return <GameContainer />
}
