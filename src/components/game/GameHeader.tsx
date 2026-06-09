'use client'

import React from 'react'
import { GameMenu } from './GameMenu'

interface GameHeaderProps {
  movesLeft: number
  maxMoves: number
  mainDeckCount: number
  coins: number
  onRestart: () => void
  onGoHome: () => void
}

export function GameHeader({ movesLeft, maxMoves, mainDeckCount, coins, onRestart, onGoHome }: GameHeaderProps) {
  const isLow = movesLeft <= 10
  const isCritical = movesLeft <= 5

  return (
    <div className="w-full flex items-center justify-between px-2 py-1">
      {/* 左: メニューボタン */}
      <div className="min-w-[48px] flex justify-start">
        <GameMenu onRestart={onRestart} onGoHome={onGoHome} />
      </div>

      {/* 中央: 手数表示 */}
      <div
        className={`
          flex flex-col items-center px-5 py-0.5 rounded-xl shadow-lg
          ${isCritical ? 'bg-red-600' : isLow ? 'bg-orange-500' : 'bg-green-600'}
          transition-colors duration-300
        `}
        aria-label={`残り手数: ${movesLeft}`}
        role="status"
      >
        <span className="text-white/80 text-[11px] font-medium">残り手数</span>
        <span className={`text-white font-extrabold text-2xl leading-none ${isCritical ? 'animate-pulse' : ''}`}>
          {movesLeft}
        </span>
        <span className="text-white/60 text-[11px]">/ {maxMoves}</span>
      </div>

      {/* 右: コイン＋山札 */}
      <div className="flex flex-col items-end gap-1 min-w-[48px]">
        {/* コイン */}
        <div className="flex items-center gap-1 bg-yellow-500/20 border border-yellow-400/40 rounded-full px-2 py-0.5">
          <span className="text-sm">🪙</span>
          <span className="text-yellow-300 font-bold text-xs">{coins.toLocaleString()}</span>
        </div>
        {/* 山札 */}
        <div className="flex flex-col items-center bg-green-900/60 rounded-lg px-2 py-0.5 w-full">
          <span className="text-green-300 text-[10px]">山札</span>
          <span className="text-white font-bold text-sm leading-none">{mainDeckCount}</span>
        </div>
      </div>
    </div>
  )
}
