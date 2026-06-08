'use client'

import React from 'react'
import { motion } from 'framer-motion'
import type { PlayCard } from '@/types/game'

interface GameCardProps {
  card: PlayCard
  isSelectable?: boolean
  isSelected?: boolean
  isHinted?: boolean
  onClick?: () => void
  onDragStart?: () => void
  compact?: boolean
}

export function GameCard({
  card,
  isSelectable = false,
  isSelected = false,
  isHinted = false,
  onClick,
  onDragStart,
  compact = false,
}: GameCardProps) {
  const isFaceUp = card.face === 'face_up'
  const isCategory = card.data.type === 'category'

  const cardBase = 'w-full h-full rounded-xl shadow-md overflow-hidden relative select-none'

  const selectedStyle = isSelected ? 'ring-2 ring-yellow-400 ring-offset-1 scale-105' : ''
  const hintedStyle = isHinted ? 'ring-2 ring-orange-400 ring-offset-1 animate-pulse' : ''
  const selectableStyle = isSelectable ? 'cursor-pointer hover:scale-105 active:scale-95' : ''

  return (
    <motion.div
      layoutId={card.instanceId}
      layout
      className={`
        ${cardBase}
        ${selectedStyle}
        ${hintedStyle}
        ${selectableStyle}
        transition-all duration-150
      `}
      onClick={isSelectable && onClick ? (e) => { e.stopPropagation(); onClick() } : undefined}
      whileTap={isSelectable ? { scale: 0.95 } : undefined}
      transition={{ type: 'spring', damping: 20, stiffness: 300 }}
      role={isSelectable ? 'button' : undefined}
      tabIndex={isSelectable ? 0 : undefined}
      onKeyDown={isSelectable && onClick ? (e) => { if (e.key === 'Enter' || e.key === ' ') onClick() } : undefined}
      draggable={isSelectable}
      onDragStart={isSelectable && onDragStart ? () => onDragStart() : undefined}
    >
      {isFaceUp ? (
        // 表面: カード種別に応じた画像を背景に使用
        <div
          className="w-full h-full flex items-center justify-center"
          style={{
            backgroundImage: isCategory ? 'url(/images/category_card.png)' : 'url(/images/card.png)',
            backgroundSize: '100% 100%',
            backgroundRepeat: 'no-repeat',
          }}
        >
          <span className={`
            font-bold text-center leading-tight break-words px-2 w-full
            ${isCategory ? 'text-red-900 text-[11px]' : 'text-gray-800 text-[11px]'}
          `}>
            {card.data.text}
          </span>
        </div>
      ) : (
        // 裏面: カード裏面画像
        <div
          className="w-full h-full"
          style={{
            backgroundImage: 'url(/images/card_back.png)',
            backgroundSize: '100% 100%',
            backgroundRepeat: 'no-repeat',
          }}
        />
      )}
    </motion.div>
  )
}
