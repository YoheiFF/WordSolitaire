'use client'

import React, { useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import type { PlayCard } from '@/types/game'
import { useDragStore } from '@/store/dragStore'
import { useGameStore } from '@/store/gameStore'

interface GameCardProps {
  card: PlayCard
  isSelectable?: boolean
  isSelected?: boolean
  isHinted?: boolean
  categoryTotal?: number   // カテゴリ解放後の総枚数バッジ（0または未指定なら非表示）
  onClick?: () => void
  onDragStart?: () => void
  compact?: boolean
}

/** 選択後にゲームストアからドラッググループを取得する（hooks 外で呼べる） */
function getDragGroup(fallback: PlayCard): PlayCard[] {
  const gameState = useGameStore.getState().gameState
  if (!gameState?.selectedCard) return [fallback]
  const source = gameState.selectedCardSource
  if (source?.type === 'columnStack') {
    const stack = gameState.columnStacks[source.col]
    const idx = stack.findIndex((c) => c.instanceId === gameState.selectedCard!.instanceId)
    if (idx >= 0) return stack.slice(idx)
  }
  return [gameState.selectedCard]
}

export function GameCard({
  card,
  isSelectable = false,
  isSelected = false,
  isHinted = false,
  categoryTotal = 0,
  onClick,
  onDragStart,
  compact = false,
}: GameCardProps) {
  const isFaceUp = card.face === 'face_up'
  const isCategory = card.data.type === 'category'
  const { setDrag, updatePos, clearDrag } = useDragStore()
  const isDraggingThis = useDragStore((s) =>
    s.cards.length > 0 && s.cards.some((c) => c.instanceId === card.instanceId)
  )

  const cardRef = useRef<HTMLDivElement>(null)
  const stableRef = useRef({ card, setDrag, updatePos, clearDrag, onDragStart, isSelectable })
  stableRef.current = { card, setDrag, updatePos, clearDrag, onDragStart, isSelectable }

  const touchRef = useRef({ moved: false, startX: 0, startY: 0 })

  // HTML5 ドラッグ: Framer Motion の onDrag/onDragEnd と競合しないようネイティブで登録
  useEffect(() => {
    const el = cardRef.current
    if (!el) return

    const handleDragStart = (e: DragEvent) => {
      if (!stableRef.current.isSelectable) return

      // ブラウザ既定のゴーストを非表示（canvas を DOM に一時挿入）
      const canvas = document.createElement('canvas')
      canvas.width = 1
      canvas.height = 1
      canvas.style.cssText = 'position:fixed;top:-100px;pointer-events:none'
      document.body.appendChild(canvas)
      e.dataTransfer?.setDragImage(canvas, 0, 0)
      if (e.dataTransfer) e.dataTransfer.effectAllowed = 'move'
      requestAnimationFrame(() => canvas.remove())

      // カードを選択してからグループを取得
      stableRef.current.onDragStart?.()
      const group = getDragGroup(stableRef.current.card)
      const rect = el.getBoundingClientRect()
      stableRef.current.setDrag(group, e.clientX, e.clientY, rect.width, rect.height)
    }

    const handleDrag = (e: DragEvent) => {
      if (e.clientX === 0 && e.clientY === 0) return
      stableRef.current.updatePos(e.clientX, e.clientY)
    }

    const handleDragEnd = () => {
      stableRef.current.clearDrag()
    }

    el.addEventListener('dragstart', handleDragStart)
    el.addEventListener('drag', handleDrag)
    el.addEventListener('dragend', handleDragEnd)
    return () => {
      el.removeEventListener('dragstart', handleDragStart)
      el.removeEventListener('drag', handleDrag)
      el.removeEventListener('dragend', handleDragEnd)
    }
  }, [])

  // ---- タッチドラッグ ----
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
      // カード選択後にグループを取得してオーバーレイ開始
      const group = getDragGroup(card)
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
      setDrag(group, t.clientX, t.clientY, rect.width, rect.height)
    }
    if (touchRef.current.moved) {
      updatePos(t.clientX, t.clientY)
    }
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!isSelectable) return
    clearDrag()
    if (!touchRef.current.moved) {
      touchRef.current = { moved: false, startX: 0, startY: 0 }
      return
    }
    e.preventDefault()
    const t = e.changedTouches[0]
    const { clientX, clientY } = t
    touchRef.current = { moved: false, startX: 0, startY: 0 }

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
  const draggingStyle = isDraggingThis ? 'opacity-30' : ''

  return (
    <motion.div
      ref={cardRef}
      layoutId={card.instanceId}
      layout
      className={`
        ${cardBase}
        ${selectedStyle}
        ${hintedStyle}
        ${selectableStyle}
        ${draggingStyle}
        transition-all duration-150
      `}
      style={{
        touchAction: isSelectable ? 'none' : 'auto',
        WebkitTouchCallout: 'none' as React.CSSProperties['WebkitTouchCallout'],
      }}
      draggable={isSelectable}
      onClick={isSelectable && onClick ? (e) => { e.stopPropagation(); onClick() } : undefined}
      onTouchStart={isSelectable ? handleTouchStart : undefined}
      onTouchMove={isSelectable ? handleTouchMove : undefined}
      onTouchEnd={isSelectable ? handleTouchEnd : undefined}
      whileTap={isSelectable ? { scale: 0.95 } : undefined}
      transition={{ type: 'spring', damping: 20, stiffness: 300 }}
      role={isSelectable ? 'button' : undefined}
      tabIndex={isSelectable ? 0 : undefined}
      onKeyDown={isSelectable && onClick ? (e) => { if (e.key === 'Enter' || e.key === ' ') onClick() } : undefined}
    >
      {isFaceUp ? (
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
            ${isCategory ? 'text-red-900 text-[13px]' : 'text-gray-800 text-[13px]'}
          `}>
            {card.data.text}
          </span>
          {/* カテゴリ総枚数バッジ */}
          {categoryTotal > 0 && (
            <div className="absolute top-0.5 left-0.5 bg-black/35 text-white text-[8px] font-bold px-[3px] py-px rounded leading-tight">
              全{categoryTotal}
            </div>
          )}
        </div>
      ) : (
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
