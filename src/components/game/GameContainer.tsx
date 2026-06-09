'use client'

import React, { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { GameHeader } from './GameHeader'
import { DeckArea } from './DeckArea'
import { CategoryRow } from './CategoryRow'
import { CardStackArea } from './CardStackArea'
import { BoosterBar } from './BoosterBar'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { DragOverlay } from '@/components/ui/DragOverlay'
import { useGameStore, selectHistory } from '@/store/gameStore'
import { saveProgress } from '@/lib/api'
import { useBgm } from '@/hooks/useBgm'
import { addCoins, calcClearCoins } from '@/lib/coins'

const PLAYER_ID_KEY = 'word-solitaire-player-id'

function getOrCreatePlayerId(): string {
  if (typeof window === 'undefined') return 'server'
  let id = localStorage.getItem(PLAYER_ID_KEY)
  if (!id) {
    id = crypto.randomUUID()
    localStorage.setItem(PLAYER_ID_KEY, id)
  }
  return id
}

export function GameContainer() {
  const router = useRouter()
  const gameState = useGameStore((s) => s.gameState)
  const hint = useGameStore((s) => s.hint)
  const history = useGameStore(selectHistory)
  const { resetGame, clearHint } = useGameStore()

  const isCleared = gameState?.status === 'cleared'
  const isFailed = gameState?.status === 'failed'

  useBgm('/audio/bgm.mp3')

  // クリア・失敗時に進捗を保存
  useEffect(() => {
    if (!gameState) return
    if (gameState.status !== 'cleared' && gameState.status !== 'failed') return

    const playerId = getOrCreatePlayerId()
    saveProgress({
      playerId,
      stageId: gameState.stageId,
      cleared: gameState.status === 'cleared',
      movesRemaining: gameState.movesLeft,
    }).catch(console.error)
  }, [gameState?.status])

  // クリア時にコインを付与（status が cleared に変化したとき1回だけ）
  useEffect(() => {
    if (gameState?.status !== 'cleared') return
    const { total } = calcClearCoins(gameState.stageId, gameState.movesLeft)
    addCoins(total)
  }, [gameState?.status])

  if (!gameState) return null

  const hintedCardId = hint?.card.instanceId ?? null
  const hintedSlotIndex = hint?.suggestedSlotIndex ?? null

  const handleRetry = () => {
    clearHint()
    resetGame()
  }

  const handleGoHome = () => {
    router.push('/')
  }

  return (
    <div className="relative flex flex-col gap-1.5 w-full max-w-sm mx-auto px-2 pb-2 min-h-dvh">
      <DragOverlay />
      {/* ヘッダー */}
      <GameHeader
        movesLeft={gameState.movesLeft}
        maxMoves={gameState.maxMoves}
        mainDeckCount={gameState.mainDeck.length}
        onRestart={handleRetry}
        onGoHome={handleGoHome}
      />

      {/* カテゴリスロット行 */}
      <div className="px-1">
        <CategoryRow
          categorySlots={gameState.categorySlots}
          hintedSlotIndex={hintedSlotIndex}
        />
      </div>

      {/* 山札エリア */}
      <div className="px-1">
        <DeckArea
          mainDeck={gameState.mainDeck}
          centerDeck={gameState.centerDeck}
          hintedCardInstanceId={hintedCardId}
        />
      </div>

      {/* カードスタックエリア */}
      <div className="px-1 flex-1">
        <CardStackArea
          columnStacks={gameState.columnStacks}
          categorySlots={gameState.categorySlots}
          hintedCardInstanceId={hintedCardId}
        />
      </div>

      {/* ヒントメッセージ */}
      <AnimatePresence>
        {hint && (
          <motion.div
            className="mx-1 bg-orange-100 border border-orange-300 rounded-xl px-3 py-2 flex items-start justify-between gap-2"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
          >
            <p className="text-orange-800 text-sm flex-1">{hint.message}</p>
            <button
              className="text-orange-500 text-lg leading-none"
              onClick={clearHint}
              aria-label="ヒントを閉じる"
            >
              ✕
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ブースターバー */}
      <div className="px-1">
        <BoosterBar
          hintUsed={gameState.hintUsed}
          maxHints={gameState.maxHints}
          historyCount={history.length}
        />
      </div>

      {/* クリアモーダル */}
      <Modal isOpen={isCleared} title="クリア！">
        {(() => {
          const coins = isCleared ? calcClearCoins(gameState.stageId, gameState.movesLeft) : null
          return (
            <div className="flex flex-col items-center gap-4">
              <p className="text-6xl">🎉</p>
              <p className="text-gray-600 text-center">
                おめでとうございます！<br />
                残り手数: <span className="font-bold text-green-600">{gameState.movesLeft}</span>
              </p>

              {/* コイン獲得内訳 */}
              {coins && (
                <div className="w-full bg-yellow-50 border border-yellow-200 rounded-xl px-4 py-3 space-y-1">
                  <p className="text-yellow-700 font-bold text-sm text-center mb-2">🪙 コイン獲得！</p>
                  <div className="flex justify-between text-sm text-yellow-700">
                    <span>Lv.{gameState.stageId} ボーナス</span>
                    <span className="font-semibold">+{coins.levelBonus}</span>
                  </div>
                  <div className="flex justify-between text-sm text-yellow-700">
                    <span>残り{gameState.movesLeft}手ボーナス</span>
                    <span className="font-semibold">+{coins.movesBonus}</span>
                  </div>
                  <div className="flex justify-between text-sm font-bold text-yellow-800 border-t border-yellow-200 pt-1 mt-1">
                    <span>合計</span>
                    <span>+{coins.total} コイン</span>
                  </div>
                </div>
              )}

              {gameState.stageId < 30 ? (
                <Button
                  variant="primary"
                  size="md"
                  onClick={() => router.push(`/play/${gameState.stageId + 1}`)}
                  className="w-full"
                >
                  次のステージへ ▶
                </Button>
              ) : (
                <p className="text-yellow-600 font-bold text-center">🏆 全ステージクリア！</p>
              )}
              <div className="flex gap-3 w-full">
                <Button variant="secondary" size="md" onClick={handleGoHome} className="flex-1">
                  ホームへ
                </Button>
                <Button variant="secondary" size="md" onClick={handleRetry} className="flex-1">
                  もう一度
                </Button>
              </div>
            </div>
          )
        })()}
      </Modal>

      {/* 失敗モーダル */}
      <Modal isOpen={isFailed} title="ゲームオーバー">
        <div className="flex flex-col items-center gap-4">
          <p className="text-6xl">😢</p>
          <p className="text-gray-600 text-center">
            残念！手数が尽きてしまいました。
          </p>
          <div className="flex gap-3 w-full">
            <Button variant="secondary" size="md" onClick={handleGoHome} className="flex-1">
              ホームへ
            </Button>
            <Button variant="primary" size="md" onClick={handleRetry} className="flex-1">
              リトライ
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
