'use client'

import React, { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import type { CategorySlot as CategorySlotType, PlayCard } from '@/types/game'
import { useGameStore } from '@/store/gameStore'
import { useDragStore } from '@/store/dragStore'
import { useSe } from '@/hooks/useSe'

interface CategorySlotProps {
  slot: CategorySlotType
  slotIndex: number
  hintedSlotIndex?: number | null
}

export function CategorySlot({ slot, slotIndex, hintedSlotIndex }: CategorySlotProps) {
  const { gameState, placeToCategorySlot, placeToColumnStack, resetFilledSlot } = useGameStore()
  const { play: playSe } = useSe('/audio/place.mp3')
  const { play: playCancel } = useSe('/audio/cancel.mp3')
  const { play: playComplete } = useSe('/audio/complete.mp3')
  const selectedCard = gameState?.selectedCard ?? null
  const selectedSource = gameState?.selectedCardSource ?? null

  const isHinted = hintedSlotIndex === slotIndex

  // filled 状態を検知して完成音を鳴らし、600ms 後にリセット
  const prevStateRef = useRef(slot.state)
  useEffect(() => {
    if (slot.state === 'filled') {
      playComplete()
      const t = setTimeout(() => resetFilledSlot(slotIndex), 600)
      return () => clearTimeout(t)
    }
    prevStateRef.current = slot.state
  }, [slot.state, slotIndex, resetFilledSlot])

  // グループを取得（列スタックから選択時は selectedCard 以降を全て）
  const selectedGroup: PlayCard[] = (() => {
    if (!selectedCard) return []
    if (!selectedSource || selectedSource.type !== 'columnStack') return [selectedCard]
    const sourceCol = gameState?.columnStacks[selectedSource.col] ?? []
    const idx = sourceCol.findIndex((c) => c.instanceId === selectedCard.instanceId)
    return idx >= 0 ? sourceCol.slice(idx) : [selectedCard]
  })()

  const canPlaceCategoryCard =
    selectedCard?.data.type === 'category' && slot.state === 'locked'

  const canPlaceNormalCard =
    selectedGroup.length > 0 &&
    selectedGroup.every((c) => c.data.type === 'normal') &&
    slot.state === 'empty' &&
    selectedGroup.every((c) => c.data.categoryId === slot.category?.id) &&
    slot.placedCards.length + selectedGroup.length <= slot.totalExpected

  const isClickable = selectedCard !== null && (canPlaceCategoryCard || canPlaceNormalCard)
  const hintsEnabled = (gameState?.stageId ?? 1) === 1

  const [shakeKey, setShakeKey] = useState(0)
  const triggerShake = () => {
    setShakeKey((k) => k + 1)
    playCancel()
    navigator.vibrate?.(80)
  }

  const handlePlace = () => {
    if (canPlaceCategoryCard) {
      playSe(); placeToCategorySlot(slotIndex)
    } else if (canPlaceNormalCard) {
      playSe(); placeToColumnStack(slotIndex)
    } else if (selectedCard !== null) {
      triggerShake()
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    if (isClickable) {
      e.preventDefault()
      e.dataTransfer.dropEffect = 'move'
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    useDragStore.getState().clearDrag()
    handlePlace()
  }

  const sharedProps = {
    'data-drop-zone': 'true',
    onClick: handlePlace,
    onDragOver: handleDragOver,
    onDrop: handleDrop,
  }

  const shakeAnim = shakeKey > 0 ? { x: [0, -8, 8, -5, 5, -2, 2, 0] } : { x: 0 }
  const shakeTrans = { duration: 0.4, ease: 'easeOut' as const }

  // locked: カテゴリカードを置くと開放されるプレースホルダー
  if (slot.state === 'locked') {
    return (
      <motion.div
        key={shakeKey}
        animate={shakeAnim}
        transition={shakeTrans}
        className={`
          flex flex-col items-center justify-center rounded-xl h-[84px] w-full
          border-2 border-dashed
          ${isClickable && hintsEnabled
            ? 'border-yellow-400 cursor-pointer bg-yellow-400/5 hover:bg-yellow-400/15'
            : isClickable
            ? 'border-green-600/50 cursor-pointer bg-transparent'
            : 'border-green-600/50 bg-transparent'}
          ${isHinted ? 'border-orange-400 animate-pulse bg-orange-400/10' : ''}
          transition-colors duration-150
        `}
        {...sharedProps}
      >
        <span className="text-green-500/70 text-2xl">＋</span>
        <span className="text-green-500/60 text-xs">カテゴリ</span>
      </motion.div>
    )
  }

  // empty / filled: カード画像を使ったカード形状
  const isFilled = slot.state === 'filled'
  return (
    <motion.div
      key={shakeKey}
      animate={shakeAnim}
      transition={shakeTrans}
      className={`
        relative rounded-xl h-[84px] w-full overflow-hidden shadow-md
        ${isClickable ? 'cursor-pointer' : ''}
        ${isHinted ? 'ring-2 ring-orange-400 animate-pulse' : ''}
        ${isClickable && !isHinted && hintsEnabled ? 'ring-2 ring-yellow-400/80' : ''}
        transition-colors duration-150 active:scale-95
      `}
      style={{
        backgroundImage: 'url(/images/category_card.png)',
        backgroundSize: '100% 100%',
        backgroundRepeat: 'no-repeat',
      }}
      {...sharedProps}
    >
      {/* テキストオーバーレイ */}
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-0.5 px-1">
        {slot.category && (
          <>
            <span className="text-red-900 font-bold text-sm text-center leading-tight break-words w-full text-center">
              {slot.category.name}
            </span>
            <span className={`text-xs font-medium ${isFilled ? 'text-yellow-600' : 'text-red-700/70'}`}>
              {slot.placedCards.length}/{slot.totalExpected}
            </span>
          </>
        )}
      </div>

      {/* 完成アニメーションオーバーレイ */}
      {isFilled && (
        <motion.div
          className="absolute inset-0 rounded-xl flex items-center justify-center"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          style={{ background: 'rgba(234,179,8,0.35)' }}
        >
          <span className="text-yellow-900 font-extrabold text-lg drop-shadow">完成！</span>
        </motion.div>
      )}
    </motion.div>
  )
}
