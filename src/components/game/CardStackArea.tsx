'use client'

import React from 'react'
import { CardStack } from './CardStack'
import type { PlayCard, CategorySlot } from '@/types/game'

interface CardStackAreaProps {
  columnStacks: PlayCard[][]
  categorySlots: CategorySlot[]
  hintedCardInstanceId?: string | null
}

export function CardStackArea({
  columnStacks,
  categorySlots,
  hintedCardInstanceId,
}: CardStackAreaProps) {
  return (
    <div className="grid grid-cols-4 gap-1.5 w-full">
      {columnStacks.map((cards, colIndex) => (
        <CardStack
          key={colIndex}
          columnIndex={colIndex}
          cards={cards}
          slot={categorySlots[colIndex] ?? null}
          hintedCardInstanceId={hintedCardInstanceId}
        />
      ))}
    </div>
  )
}
