'use client'

import React, { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useGameStore } from '@/store/gameStore'
import { Button } from '@/components/ui/Button'

export default function ResultPage() {
  const router = useRouter()
  const gameState = useGameStore((s) => s.gameState)
  const { resetGame } = useGameStore()

  // ゲーム状態がない場合はホームへリダイレクト
  useEffect(() => {
    if (!gameState) {
      router.replace('/')
    }
  }, [gameState, router])

  if (!gameState) {
    return null
  }

  const isCleared = gameState.status === 'cleared'

  const handleRetry = () => {
    resetGame()
    router.push(`/play/${gameState.stageId}`)
  }

  const handleGoHome = () => {
    router.push('/')
  }

  return (
    <main className="flex flex-col items-center justify-center min-h-dvh max-w-sm mx-auto px-4 gap-6">
      {/* 結果ヘッダー */}
      <div className="text-center">
        <p className="text-7xl mb-4">{isCleared ? '🎉' : '😢'}</p>
        <h1 className="text-3xl font-extrabold text-white">
          {isCleared ? 'クリア！' : 'ゲームオーバー'}
        </h1>
        <p className="text-green-200 mt-2">
          {isCleared
            ? 'おめでとうございます！全てのカードを配置しました。'
            : '手数が尽きてしまいました。リトライしましょう！'}
        </p>
      </div>

      {/* スコア表示 */}
      <div className="w-full bg-green-900/60 rounded-2xl p-5 space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-green-200">残り手数</span>
          <span className="text-white font-bold text-xl">{gameState.movesLeft}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-green-200">最大手数</span>
          <span className="text-white font-bold text-xl">{gameState.maxMoves}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-green-200">ヒント使用</span>
          <span className="text-white font-bold text-xl">
            {gameState.hintUsed} / {gameState.maxHints}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-green-200">配置カード数</span>
          <span className="text-white font-bold text-xl">
            {gameState.categorySlots.reduce((sum, s) => sum + s.placedCards.length, 0)}
            {' / '}
            {gameState.totalNormalCards}
          </span>
        </div>
      </div>

      {/* アクションボタン */}
      <div className="flex flex-col gap-3 w-full">
        <Button variant="primary" size="lg" onClick={handleRetry} className="w-full">
          {isCleared ? 'もう一度プレイ' : 'リトライ'}
        </Button>
        <Button variant="ghost" size="lg" onClick={handleGoHome} className="w-full">
          ステージ選択へ
        </Button>
      </div>
    </main>
  )
}
