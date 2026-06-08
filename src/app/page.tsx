'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { fetchStageList } from '@/lib/api'
import type { StageListItem } from '@/types/game'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { Button } from '@/components/ui/Button'

export default function HomePage() {
  const router = useRouter()
  const [stages, setStages] = useState<StageListItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchStageList()
      .then(setStages)
      .catch((err) => setError(err.message))
      .finally(() => setIsLoading(false))
  }, [])

  const handleStart = (stageId: number) => {
    router.push(`/play/${stageId}`)
  }

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

      {/* ゲーム説明 */}
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
          <Button
            variant="secondary"
            size="sm"
            onClick={() => window.location.reload()}
            className="mt-3"
          >
            再読み込み
          </Button>
        </div>
      ) : (
        <div className="w-full space-y-3">
          <h2 className="text-white font-bold text-lg">ステージ選択</h2>
          {stages.length === 0 ? (
            <p className="text-green-300 text-sm text-center py-4">
              ステージがありません
            </p>
          ) : (
            stages.map((stage) => (
              <button
                key={stage.id}
                className="w-full bg-white/10 hover:bg-white/20 active:bg-white/30 border border-white/20 rounded-2xl p-4 text-left transition-all duration-150 cursor-pointer"
                onClick={() => handleStart(stage.id)}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white font-bold">{stage.name}</p>
                    <p className="text-green-300 text-sm mt-0.5">
                      制限手数: {stage.totalMoves}手
                    </p>
                  </div>
                  <div className="text-white/60 text-2xl">▶</div>
                </div>
              </button>
            ))
          )}
        </div>
      )}
    </main>
  )
}
