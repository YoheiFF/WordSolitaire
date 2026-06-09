'use client'

import React from 'react'
import { motion } from 'framer-motion'
import type { PlayCard } from '@/types/game'

interface MainDeckProps {
  cards: PlayCard[]
  onClick: () => void
  onRefresh?: () => void
  canRefresh?: boolean
  disabled?: boolean
}

export function MainDeck({ cards, onClick, onRefresh, canRefresh = false, disabled = false }: MainDeckProps) {
  const count = cards.length
  const isEmpty = count === 0
  const showRefresh = isEmpty && canRefresh

  const handleClick = () => {
    if (disabled) return
    if (isEmpty && showRefresh) onRefresh?.()
    else if (!isEmpty) onClick()
  }

  return (
    <div className="flex flex-col items-center gap-1">
      <motion.div
        className={`
          w-14 h-20 rounded-xl flex flex-col items-center justify-center
          border-2 shadow-md select-none
          ${showRefresh
            ? 'bg-amber-700/80 border-amber-500 cursor-pointer hover:bg-amber-600 active:scale-95'
            : isEmpty
              ? 'bg-green-900/40 border-dashed border-green-700 opacity-50'
              : 'bg-green-700 border-green-600 cursor-pointer hover:bg-green-600 active:scale-95'
          }
          transition-all duration-150
        `}
        onClick={!disabled ? handleClick : undefined}
        whileTap={!disabled && (!isEmpty || showRefresh) ? { scale: 0.95 } : undefined}
        role={(!isEmpty || showRefresh) ? 'button' : undefined}
        tabIndex={(!isEmpty || showRefresh) ? 0 : undefined}
        onKeyDown={!disabled && (!isEmpty || showRefresh) ? (e) => { if (e.key === 'Enter') handleClick() } : undefined}
        aria-label={showRefresh ? '山札をリフレッシュ' : `山札 残り${count}枚`}
      >
        {showRefresh ? (
          <div className="flex flex-col items-center gap-1">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-7 h-7 text-amber-200">
              <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
              <path d="M3 3v5h5" />
            </svg>
          </div>
        ) : isEmpty ? (
          <span className="text-green-600 text-2xl">○</span>
        ) : (
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
        )}
      </motion.div>
      <span className="text-white text-xs font-medium">
        {showRefresh ? '戻す' : `${count}枚`}
      </span>
    </div>
  )
}
