'use client'

import React from 'react'
import type { CategorySlot as CategorySlotType, PlayCard } from '@/types/game'
import { useGameStore } from '@/store/gameStore'

interface CategorySlotProps {
  slot: CategorySlotType
  slotIndex: number
  hintedSlotIndex?: number | null
}

export function CategorySlot({ slot, slotIndex, hintedSlotIndex }: CategorySlotProps) {
  const { gameState, placeToCategorySlot, placeToColumnStack } = useGameStore()
  const selectedCard = gameState?.selectedCard ?? null
  const selectedSource = gameState?.selectedCardSource ?? null

  const isHinted = hintedSlotIndex === slotIndex

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
  // ステージ1のみカテゴリ一致のヒントを色で表示する
  const hintsEnabled = (gameState?.stageId ?? 1) === 1

  const handlePlace = () => {
    if (canPlaceCategoryCard) {
      placeToCategorySlot(slotIndex)
    } else if (canPlaceNormalCard) {
      placeToColumnStack(slotIndex)
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
    handlePlace()
  }

  const sharedProps = {
    'data-drop-zone': 'true',
    onClick: handlePlace,
    onDragOver: handleDragOver,
    onDrop: handleDrop,
  }

  // locked: カテゴリカードを置くと開放されるプレースホルダー
  if (slot.state === 'locked') {
    return (
      <div
        className={`
          flex flex-col items-center justify-center rounded-xl h-20 w-full
          border-2 border-dashed
          ${isClickable && hintsEnabled
            ? 'border-yellow-400 cursor-pointer bg-yellow-400/5 hover:bg-yellow-400/15'
            : isClickable
            ? 'border-green-600/50 cursor-pointer bg-transparent'
            : 'border-green-600/50 bg-transparent'}
          ${isHinted ? 'border-orange-400 animate-pulse bg-orange-400/10' : ''}
          transition-all duration-150
        `}
        {...sharedProps}
      >
        <span className="text-green-500/70 text-lg">＋</span>
        <span className="text-green-500/60 text-[10px]">カテゴリ</span>
      </div>
    )
  }

  // empty / filled: カード画像を使ったカード形状
  const isFilled = slot.state === 'filled'
  return (
    <div
      className={`
        relative rounded-xl h-20 w-full overflow-hidden shadow-md
        ${isClickable ? 'cursor-pointer' : ''}
        ${isHinted ? 'ring-2 ring-orange-400 animate-pulse' : ''}
        ${isClickable && !isHinted && hintsEnabled ? 'ring-2 ring-yellow-400/80' : ''}
        transition-all duration-150 active:scale-95
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
            <span className="text-red-900 font-bold text-[11px] text-center leading-tight break-words w-full text-center">
              {slot.category.name}
            </span>
            <span className={`text-[10px] font-medium ${isFilled ? 'text-yellow-600' : 'text-red-700/70'}`}>
              {slot.placedCards.length}/{slot.totalExpected}
            </span>
          </>
        )}
      </div>

      {/* クリア済みの金色オーバーレイ */}
      {isFilled && (
        <div className="absolute inset-0 bg-yellow-400/15 rounded-xl" />
      )}
    </div>
  )
}
