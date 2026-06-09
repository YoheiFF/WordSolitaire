'use client'

import React from 'react'
import { MainDeck } from './MainDeck'
import { CenterDeck } from './CenterDeck'
import type { PlayCard } from '@/types/game'
import { useGameStore } from '@/store/gameStore'

interface DeckAreaProps {
  mainDeck: PlayCard[]
  centerDeck: PlayCard[]
  hintedCardInstanceId?: string | null
}

export function DeckArea({ mainDeck, centerDeck, hintedCardInstanceId }: DeckAreaProps) {
  const { drawFromMainDeck, refreshDeck, gameState } = useGameStore()
  const isPlaying = gameState?.status === 'playing'
  const canRefresh = mainDeck.length === 0 && centerDeck.length > 0

  return (
    <div className="flex items-center justify-between w-full px-2">
      {/* 左: 捨て山（中央山札） */}
      <CenterDeck cards={centerDeck} hintedCardInstanceId={hintedCardInstanceId} />

      {/* 右: メイン山札 */}
      <MainDeck
        cards={mainDeck}
        onClick={drawFromMainDeck}
        onRefresh={refreshDeck}
        canRefresh={canRefresh}
        disabled={!isPlaying}
      />
    </div>
  )
}
