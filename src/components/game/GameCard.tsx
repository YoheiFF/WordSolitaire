'use client'

import React, { useRef } from 'react'
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

  // タッチドラッグ用
  const touchRef = useRef({ moved: false, startX: 0, startY: 0 })

  const handleTouchStart = (e: React.TouchEvent) => {
    if (!isSelectable) return
    const t = e.touches[0]
    touchRef.current = { moved: false, startX: t.clientX, startY: t.clientY }
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isSelectable) return
    const t = e.touches[0]
    if (!touchRef.current.moved &&
        Math.hypot(t.clientX - touchRef.current.startX, t.clientY - touchRef.current.startY) > 8) {
      touchRef.current.moved = true
      if (!isSelected) onClick?.()
    }
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!isSelectable) return
    if (!touchRef.current.moved) {
      touchRef.current = { moved: false, startX: 0, startY: 0 }
      return
    }
    // ドラッグ終了: 後続のclickイベントを抑制し、ドロップ先を探す
    e.preventDefault()
    const t = e.changedTouches[0]
    const { clientX, clientY } = t
    touchRef.current = { moved: false, startX: 0, startY: 0 }

    // React再レンダー後にドロップ先を検出してclickを発火
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const els = document.elementsFromPoint?.(clientX, clientY)
          ?? ([document.elementFromPoint(clientX, clientY)].filter(Boolean) as Element[])
        for (const el of els) {
          if (el instanceof HTMLElement && el.dataset.dropZone) {
            el.click()
            break
          }
        }
      })
    })
  }

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
      style={{
        touchAction: isSelectable ? 'none' : 'auto',
        WebkitTouchCallout: 'none' as React.CSSProperties['WebkitTouchCallout'],
      }}
      onClick={isSelectable && onClick ? (e) => { e.stopPropagation(); onClick() } : undefined}
      onTouchStart={isSelectable ? handleTouchStart : undefined}
      onTouchMove={isSelectable ? handleTouchMove : undefined}
      onTouchEnd={isSelectable ? handleTouchEnd : undefined}
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
