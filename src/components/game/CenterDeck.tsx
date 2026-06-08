'use client'

import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { GameCard } from './GameCard'
import type { PlayCard } from '@/types/game'
import { useGameStore } from '@/store/gameStore'

interface CenterDeckProps {
  cards: PlayCard[]
  hintedCardInstanceId?: string | null
}

export function CenterDeck({ cards, hintedCardInstanceId }: CenterDeckProps) {
  const { gameState, selectCard } = useGameStore()
  const selectedCard = gameState?.selectedCard ?? null

  const count = cards.length
  const topCard = count > 0 ? cards[count - 1] : null
  const isSelected = selectedCard?.instanceId === topCard?.instanceId

  const handleClick = () => {
    if (!topCard) return
    selectCard(topCard, { type: 'centerDeck' })
  }

  return (
    <div className="flex flex-col items-center gap-1">
      {/*
        pile wrapper: w-16 h-16 (64px) to accommodate card (w-14=56px h-14=56px) + offset layers
        shadows offset by up to +4px right, +8px down → total 60px × 64px fits in w-16 h-16
      */}
      <div className="relative w-20 h-20">
        {count === 0 ? (
          <div className="absolute inset-0 rounded-xl border-2 border-dashed border-green-700 bg-green-900/30 flex items-center justify-center">
            <span className="text-green-600 text-xs">空</span>
          </div>
        ) : (
          <>
            {/* 3枚目以降: 最も奥のシャドウ */}
            {count >= 3 && (
              <div className="absolute top-2 left-1 w-16 h-16 rounded-xl bg-gray-200 border border-gray-300 shadow-sm" />
            )}
            {/* 2枚目: 中間シャドウ */}
            {count >= 2 && (
              <div className="absolute top-1 left-0.5 w-16 h-16 rounded-xl bg-gray-100 border border-gray-200 shadow-sm" />
            )}
            {/* 最上位カード（インタラクティブ） */}
            <AnimatePresence mode="wait">
              <motion.div
                key={topCard!.instanceId}
                className="absolute top-0 left-0 w-16 h-16"
                initial={{ y: -6, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
              >
                <GameCard
                  card={topCard!}
                  isSelectable
                  isSelected={isSelected}
                  isHinted={hintedCardInstanceId === topCard!.instanceId}
                  onClick={handleClick}
                  onDragStart={!isSelected ? handleClick : undefined}
                />
              </motion.div>
            </AnimatePresence>
          </>
        )}
      </div>
      <span className="text-white text-xs font-medium">{count}枚</span>
    </div>
  )
}
