'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { GameCard } from './GameCard'
import type { PlayCard, CategorySlot } from '@/types/game'
import { useGameStore } from '@/store/gameStore'
import { useDragStore } from '@/store/dragStore'

interface CardStackProps {
  columnIndex: number
  cards: PlayCard[]
  slot: CategorySlot | null
  hintedCardInstanceId?: string | null
}

export function CardStack({ columnIndex, cards, slot, hintedCardInstanceId }: CardStackProps) {
  const { gameState, selectCard, placeToColumnStack, stackCardOnColumn } = useGameStore()
  const [shakeKey, setShakeKey] = useState(0)

  const triggerShake = () => {
    setShakeKey((k) => k + 1)
    navigator.vibrate?.(80)
  }
  const selectedCard = gameState?.selectedCard ?? null
  const selectedSource = gameState?.selectedCardSource ?? null

  // グループを取得（列スタックから選択時は selectedCard 以降を全て）
  const selectedGroup = (() => {
    if (!selectedCard) return []
    if (!selectedSource || selectedSource.type !== 'columnStack') return [selectedCard]
    const sourceCol = gameState?.columnStacks[selectedSource.col] ?? []
    const idx = sourceCol.findIndex((c) => c.instanceId === selectedCard.instanceId)
    return idx >= 0 ? sourceCol.slice(idx) : [selectedCard]
  })()

  const handleCardClick = (_card: PlayCard) => {
    // カテゴリカードは直接選択（グループ選択しない）
    if (_card.data.type === 'category') {
      selectCard(_card, { type: 'columnStack', col: columnIndex })
      return
    }
    // 通常カード: 列の最初の表向きカードを選択（グループ移動のため）
    const firstFaceUp = cards.find(c => c.face === 'face_up') ?? _card
    selectCard(firstFaceUp, { type: 'columnStack', col: columnIndex })
  }

  const bottomCard = cards.length > 0 ? cards[cards.length - 1] : null

  const allCategories = useGameStore(s => s.allCategories)

  // カテゴリスロットへの配置可否（グループ全体で判定）
  const canPlaceToSlot =
    slot !== null &&
    selectedGroup.length > 0 &&
    selectedGroup.every((c) => c.data.type === 'normal') &&
    slot.state === 'empty' &&
    selectedGroup.every((c) => c.data.categoryId === slot.category?.id) &&
    slot.placedCards.length + selectedGroup.length <= slot.totalExpected

  // 列スタックへの積み重ね可否
  const isFromThisCol = selectedSource?.type === 'columnStack' && selectedSource.col === columnIndex

  // 通常カード: 空列 or 最上位が同カテゴリの通常カード（カテゴリカードの上は不可）
  const canStackNormal =
    selectedCard?.data.type === 'normal' &&
    !isFromThisCol &&
    (
      cards.length === 0 ||
      (bottomCard !== null && bottomCard.data.type === 'normal' && bottomCard.data.categoryId === selectedCard.data.categoryId)
    )

  // カテゴリカード: 非空列かつ最上位が同カテゴリの通常カード
  const selectedCatId = selectedCard?.data.type === 'category'
    ? allCategories.find(cat => cat.name === selectedCard.data.text)?.id
    : undefined

  const canStackCategory =
    selectedCard?.data.type === 'category' &&
    !isFromThisCol &&
    cards.length > 0 &&
    bottomCard !== null &&
    bottomCard.data.type === 'normal' &&
    selectedCatId !== undefined &&
    bottomCard.data.categoryId === selectedCatId

  const canStackHere = canStackNormal || canStackCategory

  const handleStackAreaClick = () => {
    if (!selectedCard) return
    if (canStackHere) stackCardOnColumn(columnIndex)
    else if (canPlaceToSlot) placeToColumnStack(columnIndex)
    else triggerShake()
  }

  const handleDragOver = (e: React.DragEvent) => {
    if (canPlaceToSlot || canStackHere) {
      e.preventDefault()
      e.dataTransfer.dropEffect = 'move'
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    useDragStore.getState().clearDrag()
    handleStackAreaClick()
  }

  // この列に選択中のグループがある場合、開始インデックスを特定
  const isSelectedFromThisCol =
    selectedCard !== null &&
    selectedSource?.type === 'columnStack' &&
    selectedSource.col === columnIndex

  const groupStartIdx = isSelectedFromThisCol
    ? cards.findIndex((c) => c.instanceId === selectedCard!.instanceId)
    : -1

  const isDropTarget = canPlaceToSlot || canStackHere
  const hintsEnabled = (gameState?.stageId ?? 1) === 1

  // カテゴリカード用: allCategories とスロットのインデックス対応でロック中でも取得可
  const categoryNameToTotal = new Map<string, number>()
  const slots = gameState?.categorySlots ?? []
  allCategories.forEach((cat, i) => {
    const slot = slots[i]
    if (slot) categoryNameToTotal.set(cat.name, slot.totalExpected)
  })

  const CARD_H = 80  // カード1枚の高さ(px)
  const PEEK   = 18  // 重なったカードの見える幅(px)

  const stackHeight = cards.length === 0
    ? 56
    : (cards.length - 1) * PEEK + CARD_H

  return (
    <motion.div
      key={shakeKey}
      animate={shakeKey > 0 ? { x: [0, -8, 8, -5, 5, -2, 2, 0] } : { x: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className={`
        relative w-full rounded-xl
        ${isDropTarget ? `cursor-pointer${hintsEnabled ? ' ring-2 ring-yellow-400/60' : ''}` : 'cursor-default'}
        transition-colors duration-150
      `}
      style={{ height: stackHeight, minHeight: 56 }}
      data-drop-zone="true"
      onClick={handleStackAreaClick}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {cards.length === 0 ? (
        <div
          className={`
            absolute inset-0 rounded-xl border-2 border-dashed flex items-center justify-center
            ${isDropTarget && hintsEnabled ? 'border-yellow-400/70 bg-yellow-400/5' : 'border-green-700/50'}
          `}
        >
          <span className={isDropTarget && hintsEnabled ? 'text-yellow-400/70 text-xs' : 'text-green-700 text-xs'}>
            {isDropTarget && hintsEnabled ? 'ここに移動' : '空'}
          </span>
        </div>
      ) : (
        cards.map((card, idx) => {
          const isBottom = idx === cards.length - 1
          const isSelectable = card.face === 'face_up'
          const isInGroup = groupStartIdx >= 0 && idx >= groupStartIdx
          const isHinted = isBottom && hintedCardInstanceId === card.instanceId

          return (
            <div
              key={card.instanceId}
              className="absolute w-full"
              style={{ top: idx * PEEK, height: CARD_H, zIndex: idx + 1 }}
            >
              <GameCard
                card={card}
                isSelectable={isSelectable}
                isSelected={isInGroup}
                isHinted={isHinted}
                categoryTotal={
                  card.data.type === 'category'
                    ? (categoryNameToTotal.get(card.data.text) ?? 0)
                    : 0
                }
                onClick={isSelectable ? () => handleCardClick(card) : undefined}
                onDragStart={isSelectable && !isInGroup ? () => handleCardClick(card) : undefined}
              />
            </div>
          )
        })
      )}
    </motion.div>
  )
}
