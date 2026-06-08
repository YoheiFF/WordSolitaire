'use client'

import React from 'react'
import { GameCard } from './GameCard'
import type { PlayCard, CategorySlot } from '@/types/game'
import { useGameStore } from '@/store/gameStore'

interface CardStackProps {
  columnIndex: number
  cards: PlayCard[]
  slot: CategorySlot
  hintedCardInstanceId?: string | null
}

export function CardStack({ columnIndex, cards, slot, hintedCardInstanceId }: CardStackProps) {
  const { gameState, selectCard, placeToColumnStack, stackCardOnColumn } = useGameStore()
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

  const handleCardClick = (card: PlayCard) => {
    selectCard(card, { type: 'columnStack', col: columnIndex })
  }

  const bottomCard = cards.length > 0 ? cards[cards.length - 1] : null

  // カテゴリスロットへの配置可否（グループ全体で判定）
  const canPlaceToSlot =
    selectedGroup.length > 0 &&
    selectedGroup.every((c) => c.data.type === 'normal') &&
    slot.state === 'empty' &&
    selectedGroup.every((c) => c.data.categoryId === slot.category?.id) &&
    slot.placedCards.length + selectedGroup.length <= slot.totalExpected

  // 列スタックへの積み重ね可否
  // ・空列: 通常カードであれば何でも可
  // ・非空列: 最上位カードとカテゴリ一致
  // ・同一列への移動は不可
  const canStackHere =
    selectedCard?.data.type === 'normal' &&
    !(selectedSource?.type === 'columnStack' && selectedSource.col === columnIndex) &&
    (
      cards.length === 0 ||
      (bottomCard !== null && bottomCard.data.categoryId === selectedCard.data.categoryId)
    )

  const handleStackAreaClick = () => {
    if (!selectedCard) return
    // 列への積み重ねを優先、できない場合のみカテゴリスロットへ配置
    if (canStackHere) stackCardOnColumn(columnIndex)
    else if (canPlaceToSlot) placeToColumnStack(columnIndex)
  }

  const handleDragOver = (e: React.DragEvent) => {
    if (canPlaceToSlot || canStackHere) {
      e.preventDefault()
      e.dataTransfer.dropEffect = 'move'
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
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

  const CARD_H = 72  // カード1枚の高さ(px)
  const PEEK   = 18  // 重なったカードの見える幅(px)

  const stackHeight = cards.length === 0
    ? 56
    : (cards.length - 1) * PEEK + CARD_H

  return (
    <div
      className={`
        relative w-full rounded-xl
        ${isDropTarget ? 'ring-2 ring-yellow-400/60 cursor-pointer' : 'cursor-default'}
        transition-all duration-150
      `}
      style={{ height: stackHeight, minHeight: 56 }}
      onClick={handleStackAreaClick}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {cards.length === 0 ? (
        <div
          className={`
            absolute inset-0 rounded-xl border-2 border-dashed flex items-center justify-center
            ${isDropTarget ? 'border-yellow-400/70 bg-yellow-400/5' : 'border-green-700/50'}
          `}
        >
          <span className={isDropTarget ? 'text-yellow-400/70 text-xs' : 'text-green-700 text-xs'}>
            {isDropTarget ? 'ここに移動' : '空'}
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
                onClick={isSelectable ? () => handleCardClick(card) : undefined}
                onDragStart={isSelectable && !isInGroup ? () => handleCardClick(card) : undefined}
              />
            </div>
          )
        })
      )}
    </div>
  )
}
