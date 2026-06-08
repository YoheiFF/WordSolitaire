'use client'

import React from 'react'
import { Button } from '@/components/ui/Button'
import { useGameStore } from '@/store/gameStore'

interface BoosterBarProps {
  hintUsed: number
  maxHints: number
  historyCount: number
}

export function BoosterBar({ hintUsed, maxHints, historyCount }: BoosterBarProps) {
  const { useHint, undoLastAction, clearHint } = useGameStore()

  const hintsLeft = maxHints - hintUsed
  const canHint = hintsLeft > 0
  const canUndo = historyCount > 0

  const handleHint = () => {
    clearHint()
    useHint()
  }

  return (
    <div className="flex items-center justify-around w-full gap-2 py-2">
      {/* ヒントボタン */}
      <Button
        variant="secondary"
        size="sm"
        onClick={handleHint}
        disabled={!canHint}
        className="flex-1 flex flex-col items-center gap-0.5 !py-2 !min-h-0"
      >
        <span className="text-lg">💡</span>
        <span className="text-xs text-green-700 font-medium">
          ヒント ({hintsLeft}/{maxHints})
        </span>
      </Button>

      {/* アンドゥボタン */}
      <Button
        variant="secondary"
        size="sm"
        onClick={undoLastAction}
        disabled={!canUndo}
        className="flex-1 flex flex-col items-center gap-0.5 !py-2 !min-h-0"
      >
        <span className="text-lg">↩️</span>
        <span className="text-xs text-green-700 font-medium">
          アンドゥ ({historyCount})
        </span>
      </Button>

      {/* 特殊ブースター（MVP: グレーアウト） */}
      <Button
        variant="secondary"
        size="sm"
        disabled
        className="flex-1 flex flex-col items-center gap-0.5 !py-2 !min-h-0 opacity-40"
      >
        <span className="text-lg">⚡</span>
        <span className="text-xs text-green-700 font-medium">特殊</span>
      </Button>
    </div>
  )
}
