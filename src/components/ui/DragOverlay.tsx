'use client'

import React from 'react'
import { useDragStore } from '@/store/dragStore'
import type { PlayCard } from '@/types/game'

const CARD_H = 88
const PEEK   = 22

function DragCardVisual({ card }: { card: PlayCard }) {
  const isFaceUp = card.face === 'face_up'
  const isCategory = card.data.type === 'category'
  return (
    <div
      className="w-full h-full rounded-xl overflow-hidden"
      style={{
        backgroundImage: isFaceUp
          ? (isCategory ? 'url(/images/category_card.png)' : 'url(/images/card.png)')
          : 'url(/images/card_back.png)',
        backgroundSize: '100% 100%',
        backgroundRepeat: 'no-repeat',
      }}
    >
      {isFaceUp && (
        <div className="w-full h-full flex items-center justify-center">
          <span className={`font-bold text-center leading-tight break-words px-2 w-full ${
            isCategory ? 'text-red-900 text-[13px]' : 'text-gray-800 text-[13px]'
          }`}>
            {card.data.text}
          </span>
        </div>
      )}
    </div>
  )
}

export function DragOverlay() {
  const { cards, x, y, w, h } = useDragStore()
  if (cards.length === 0) return null

  // グループ全体の高さ: 先頭カードが pointer の中心に来るよう配置
  const stackHeight = (cards.length - 1) * PEEK + h

  return (
    <div
      className="fixed pointer-events-none z-50"
      style={{
        left: x - w / 2,
        top: y - h / 2,
        width: w,
        height: stackHeight,
        opacity: 0.9,
        transform: 'rotate(3deg) scale(1.05)',
        filter: 'drop-shadow(0 8px 20px rgba(0,0,0,0.5))',
        transformOrigin: 'top center',
      }}
    >
      {cards.map((card, idx) => (
        <div
          key={card.instanceId}
          className="absolute w-full"
          style={{ top: idx * PEEK, height: h, zIndex: idx + 1 }}
        >
          <DragCardVisual card={card} />
        </div>
      ))}
    </div>
  )
}
