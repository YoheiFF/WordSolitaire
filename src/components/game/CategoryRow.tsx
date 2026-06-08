'use client'

import React from 'react'
import { CategorySlot } from './CategorySlot'
import type { CategorySlot as CategorySlotType } from '@/types/game'

interface CategoryRowProps {
  categorySlots: CategorySlotType[]
  hintedSlotIndex?: number | null
}

export function CategoryRow({ categorySlots, hintedSlotIndex }: CategoryRowProps) {
  return (
    <div className="grid grid-cols-4 gap-1.5 w-full">
      {categorySlots.map((slot, i) => (
        <CategorySlot
          key={slot.columnIndex}
          slot={slot}
          slotIndex={i}
          hintedSlotIndex={hintedSlotIndex}
        />
      ))}
    </div>
  )
}
