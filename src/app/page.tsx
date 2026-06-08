'use client'

import React, { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { fetchStageList, fetchProgress } from '@/lib/api'
import type { StageListItem, ProgressRecord } from '@/types/game'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { Button } from '@/components/ui/Button'

const PLAYER_ID_KEY = 'word-solitaire-player-id'

function getOrCreatePlayerId(): string {
  let id = localStorage.getItem(PLAYER_ID_KEY)
  if (!id) {
    id = crypto.randomUUID()
    localStorage.setItem(PLAYER_ID_KEY, id)
  }
  return id
}

type StageStatus = 'locked' | 'available' | 'cleared'

export default function HomePage() {
  const router = useRouter()
  const [stages, setStages] = useState<StageListItem[]>([])
  const [progressMap, setProgressMap] = useState<Map<number, ProgressRecord>>(new Map())
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const firstAvailableRef = useRef<HTMLButtonElement | null>(null)

  useEffect(() => {
    const playerId = getOrCreatePlayerId()
    Promise.all([fetchStageList(), fetchProgress(playerId)])
      .then(([stageList, progressList]) => {
        setStages(stageList)
        const map = new Map<number, ProgressRecord>()
        for (const p of progressList) map.set(p.stageId, p)
        setProgressMap(map)
      })
      .catch((err) => setError(err.message))
      .finally(() => setIsLoading(false))
  }, [])

  // 最初の「挑戦中」ステージへスクロール
  useEffect(() => {
    if (!isLoading && firstAvailableRef.current) {
      firstAvailableRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [isLoading])

  const getStatus = (stage: StageListItem, index: number): StageStatus => {
    if (progressMap.get(stage.id)?.cleared) return 'cleared'
    if (index === 0) return 'available'
    const prev = stages[index - 1]
    if (prev && progressMap.get(prev.id)?.cleared) return 'available'
    return 'locked'
  }

  const handleStart = (stageId: number, status: StageStatus) => {
    if (status === 'locked') return
    router.push(`/play/${stageId}`)
  }

  const clearedCount = stages.filter((s) => progressMap.get(s.id)?.cleared).length

  return (
    <main className="flex flex-col items-center min-h-dvh max-w-sm mx-auto px-4 py-8 gap-6">
      {/* タイトル */}
      <div className="text-center mt-8">
        <h1 className="text-3xl font-extrabold text-white tracking-wide drop-shadow">
          ワードソリティア
        </h1>
        <p className="text-green-200 text-sm mt-2">
          カードを分類してステージをクリアしよう！
        </p>
      </div>

      {/* 遊び方 */}
      <div className="w-full bg-green-900/60 rounded-2xl p-4 text-sm text-green-100 space-y-2">
        <p className="font-bold text-white">遊び方</p>
        <ul className="list-disc list-inside space-y-1 text-green-200">
          <li>山札をめくってカードを引く</li>
          <li>カテゴリカードでスロットを解放</li>
          <li>通常カードを正しいカテゴリに配置</li>
          <li>全カード配置でクリア！</li>
        </ul>
      </div>

      {/* ステージ一覧 */}
      {isLoading ? (
        <div className="flex-1 flex items-center justify-center">
          <LoadingSpinner message="ステージを読み込み中..." />
        </div>
      ) : error ? (
        <div className="w-full bg-red-900/60 rounded-2xl p-4 text-center">
          <p className="text-red-200 text-sm">{error}</p>
          <Button variant="secondary" size="sm" onClick={() => window.location.reload()} className="mt-3">
            再読み込み
          </Button>
        </div>
      ) : (
        <div className="w-full space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-white font-bold text-lg">ステージ選択</h2>
            {stages.length > 0 && (
              <span className="text-green-300 text-sm">
                {clearedCount} / {stages.length} クリア
              </span>
            )}
          </div>

          {stages.length === 0 ? (
            <p className="text-green-300 text-sm text-center py-4">ステージがありません</p>
          ) : (
            stages.map((stage, index) => {
              const status = getStatus(stage, index)
              const progress = progressMap.get(stage.id)
              const isFirstAvailable = status === 'available' &&
                stages.slice(0, index).every((s) => progressMap.get(s.id)?.cleared || index === 0)

              return (
                <button
                  key={stage.id}
                  ref={isFirstAvailable ? firstAvailableRef : null}
                  disabled={status === 'locked'}
                  onClick={() => handleStart(stage.id, status)}
                  className={`
                    w-full border rounded-2xl p-4 text-left transition-all duration-150
                    ${status === 'locked'
                      ? 'bg-white/5 border-white/10 opacity-40 cursor-not-allowed'
                      : status === 'cleared'
                      ? 'bg-green-800/40 hover:bg-green-800/60 border-green-500/50 cursor-pointer active:scale-[0.98]'
                      : 'bg-white/10 hover:bg-white/20 border-yellow-400/60 cursor-pointer active:scale-[0.98] shadow-md shadow-yellow-400/10'
                    }
                  `}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className={`font-bold text-sm leading-tight ${status === 'locked' ? 'text-white/50' : 'text-white'}`}>
                        {stage.name}
                      </p>
                      <p className={`text-xs mt-0.5 ${status === 'locked' ? 'text-green-300/40' : 'text-green-300'}`}>
                        制限手数: {stage.totalMoves}手
                        {status === 'cleared' && progress?.bestMovesRemaining != null && (
                          <span className="ml-2 text-yellow-400">ベスト {progress.bestMovesRemaining}手残</span>
                        )}
                      </p>
                    </div>
                    <div className="text-xl shrink-0">
                      {status === 'locked' ? '🔒' : status === 'cleared' ? '✅' : '▶️'}
                    </div>
                  </div>
                </button>
              )
            })
          )}
        </div>
      )}
    </main>
  )
}
