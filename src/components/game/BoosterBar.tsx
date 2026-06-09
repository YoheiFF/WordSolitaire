'use client'

import React from 'react'
import { useGameStore } from '@/store/gameStore'
import { spendCoins } from '@/lib/coins'

interface BoosterBarProps {
  coins: number
  onCoinsChange: () => void
}

const BOOSTERS = [
  { label: '+5手', icon: '⏱️', amount: 5, cost: 30 },
  { label: '+10手', icon: '⏰', amount: 10, cost: 50 },
  { label: 'シャッフル', icon: '🔀', amount: null, cost: 100 },
] as const

export function BoosterBar({ coins, onCoinsChange }: BoosterBarProps) {
  const { addMoves, shuffleColumns } = useGameStore()

  const handleAddMoves = (amount: number, cost: number) => {
    if (!spendCoins(cost)) return
    addMoves(amount)
    onCoinsChange()
  }

  const handleShuffle = (cost: number) => {
    if (!spendCoins(cost)) return
    shuffleColumns()
    onCoinsChange()
  }

  return (
    <div className="flex items-center justify-around w-full gap-2 py-2">
      {BOOSTERS.map((b) => {
        const canUse = coins >= b.cost
        const onClick = () => {
          if (b.amount !== null) {
            handleAddMoves(b.amount, b.cost)
          } else {
            handleShuffle(b.cost)
          }
        }

        return (
          <button
            key={b.label}
            onClick={onClick}
            disabled={!canUse}
            className={`
              flex-1 flex flex-col items-center gap-0.5 py-2 px-1 rounded-xl border transition-all
              ${canUse
                ? 'bg-yellow-500/15 border-yellow-400/50 active:scale-95'
                : 'bg-white/5 border-white/10 opacity-40 cursor-not-allowed'
              }
            `}
          >
            <span className="text-xl">{b.icon}</span>
            <span className={`text-xs font-bold ${canUse ? 'text-white' : 'text-white/50'}`}>
              {b.label}
            </span>
            <span className={`text-[10px] ${canUse ? 'text-yellow-300' : 'text-white/30'}`}>
              🪙 {b.cost}
            </span>
          </button>
        )
      })}
    </div>
  )
}
