'use client'

import React from 'react'
import { motion } from 'framer-motion'
import type { PlayCard } from '@/types/game'

interface MainDeckProps {
  cards: PlayCard[]
  onClick: () => void
  disabled?: boolean
}

export function MainDeck({ cards, onClick, disabled = false }: MainDeckProps) {
  const count = cards.length
  const isEmpty = count === 0

  return (
    <div className="flex flex-col items-center gap-1">
      <motion.div
        className={`
          w-14 h-20 rounded-xl flex flex-col items-center justify-center
          border-2 shadow-md select-none
          ${isEmpty
            ? 'bg-green-900/40 border-dashed border-green-700 opacity-50'
            : 'bg-green-700 border-green-600 cursor-pointer hover:bg-green-600 active:scale-95'
          }
          transition-all duration-150
        `}
        onClick={!isEmpty && !disabled ? onClick : undefined}
        whileTap={!isEmpty && !disabled ? { scale: 0.95 } : undefined}
        role={!isEmpty ? 'button' : undefined}
        tabIndex={!isEmpty ? 0 : undefined}
        onKeyDown={!isEmpty && !disabled ? (e) => { if (e.key === 'Enter') onClick() } : undefined}
        aria-label={`山札 残り${count}枚`}
      >
        {isEmpty ? (
          <span className="text-green-600 text-2xl">○</span>
        ) : (
          <>
            {/* 重なり効果 */}
            <div className="relative w-10 h-14">
              {count > 2 && (
                <div className="absolute inset-0 translate-y-1 translate-x-0.5 bg-green-600 rounded-lg border border-green-500" />
              )}
              {count > 1 && (
                <div className="absolute inset-0 translate-y-0.5 bg-green-650 rounded-lg border border-green-500" />
              )}
              <div className="absolute inset-0 bg-green-700 rounded-lg border border-green-500 flex items-center justify-center">
                <div className="grid grid-cols-3 gap-0.5 opacity-30">
                  {Array.from({ length: 9 }).map((_, i) => (
                    <div key={i} className="w-1 h-1 bg-green-400 rounded-sm" />
                  ))}
                </div>
              </div>
            </div>
          </>
        )}
      </motion.div>
      <span className="text-white text-xs font-medium">{count}枚</span>
    </div>
  )
}
