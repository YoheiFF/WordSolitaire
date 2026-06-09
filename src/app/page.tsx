'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AnimatePresence } from 'framer-motion'
import { fetchStageList, fetchProgress } from '@/lib/api'
import type { StageListItem, ProgressRecord } from '@/types/game'
import { SplashScreen } from '@/components/ui/SplashScreen'
import { Button } from '@/components/ui/Button'
import { getCoins } from '@/lib/coins'

const PLAYER_ID_KEY = 'word-solitaire-player-id'

function getOrCreatePlayerId(): string {
  let id = localStorage.getItem(PLAYER_ID_KEY)
  if (!id) {
    id = crypto.randomUUID()
    localStorage.setItem(PLAYER_ID_KEY, id)
  }
  return id
}

export default function HomePage() {
  const router = useRouter()
  const [stages, setStages] = useState<StageListItem[]>([])
  const [progressMap, setProgressMap] = useState<Map<number, ProgressRecord>>(new Map())
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [totalCoins, setTotalCoins] = useState(0)

  useEffect(() => {
    setTotalCoins(getCoins())
    const playerId = getOrCreatePlayerId()
    // スプラッシュを最低1秒表示するため、データ取得と並行してタイマーを走らせる
    const minDisplay = new Promise<void>((res) => setTimeout(res, 1000))
    Promise.all([fetchStageList(), fetchProgress(playerId), minDisplay])
      .then(([stageList, progressList]) => {
        setStages(stageList)
        const map = new Map<number, ProgressRecord>()
        for (const p of progressList) map.set(p.stageId, p)
        setProgressMap(map)
      })
      .catch((err) => setError(err.message))
      .finally(() => setIsLoading(false))
  }, [])

  // 現在挑戦するステージ = クリアしていない最初のステージ
  const currentStage = stages.find((s) => !progressMap.get(s.id)?.cleared) ?? null
  const clearedCount = stages.filter((s) => progressMap.get(s.id)?.cleared).length
  const allCleared = stages.length > 0 && clearedCount === stages.length

  return (
    <>
      <AnimatePresence>
        {isLoading && <SplashScreen key="splash" />}
      </AnimatePresence>

    <main className="flex flex-col items-center min-h-dvh max-w-sm mx-auto px-4 py-8 gap-6">
      {/* タイトル */}
      <div className="text-center mt-8">
        <h1 className="text-3xl font-extrabold text-white tracking-wide drop-shadow">
          ワードソリティア
        </h1>
        <p className="text-green-200 text-sm mt-2">
          カードを分類してステージをクリアしよう！
        </p>
        {/* 所持コイン */}
        <div className="inline-flex items-center gap-1.5 mt-3 bg-yellow-500/20 border border-yellow-400/40 rounded-full px-4 py-1">
          <span className="text-lg">🪙</span>
          <span className="text-yellow-300 font-bold text-base">{totalCoins.toLocaleString()}</span>
          <span className="text-yellow-400/70 text-xs">コイン</span>
        </div>
      </div>

      {/* 遊び方 */}
      <div className="w-full bg-green-900/60 rounded-2xl p-4 text-sm space-y-2">
        <p className="font-bold text-white">遊び方</p>
        <ul className="list-disc list-inside space-y-1 text-green-200">
          <li>山札をめくってカードを引く</li>
          <li>カテゴリカードでスロットを解放</li>
          <li>通常カードを正しいカテゴリに配置</li>
          <li>全カード配置でクリア！</li>
        </ul>
      </div>

      {/* 現在のステージ */}
      {error ? (
        <div className="w-full bg-red-900/60 rounded-2xl p-4 text-center">
          <p className="text-red-200 text-sm">{error}</p>
          <Button variant="secondary" size="sm" onClick={() => window.location.reload()} className="mt-3">
            再読み込み
          </Button>
        </div>
      ) : allCleared ? (
        <div className="w-full flex flex-col items-center gap-3 bg-yellow-900/40 border border-yellow-500/40 rounded-2xl p-6 text-center">
          <p className="text-5xl">🏆</p>
          <p className="text-white font-bold text-lg">全ステージクリア！</p>
          <p className="text-yellow-300 text-sm">{stages.length} / {stages.length} ステージ完走おめでとう！</p>
        </div>
      ) : currentStage ? (
        <div className="w-full flex flex-col gap-4">
          {/* 進捗バー */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-green-300">進捗</span>
            <span className="text-white font-bold">{clearedCount} / {stages.length} クリア</span>
          </div>
          <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-green-400 rounded-full transition-all duration-500"
              style={{ width: `${(clearedCount / stages.length) * 100}%` }}
            />
          </div>

          {/* 現在のステージカード */}
          <div className="w-full bg-white/10 border border-yellow-400/50 rounded-2xl p-5 flex flex-col gap-4 shadow-lg shadow-yellow-400/10">
            <div>
              <p className="text-yellow-400 text-xs font-semibold tracking-wide uppercase mb-1">現在のステージ</p>
              <p className="text-white font-bold text-lg leading-snug">{currentStage.name}</p>
              <p className="text-green-300 text-sm mt-1">制限手数: {currentStage.totalMoves}手</p>
            </div>
            <Button
              variant="primary"
              size="md"
              onClick={() => router.push(`/play/${currentStage.id}`)}
              className="w-full text-base font-bold"
            >
              スタート ▶
            </Button>
          </div>
        </div>
      ) : (
        <p className="text-green-300 text-sm text-center py-4">ステージがありません</p>
      )}
    </main>
    </>
  )
}
