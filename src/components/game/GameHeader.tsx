'use client'

import React from 'react'
import { GameMenu } from './GameMenu'

interface GameHeaderProps {
  movesLeft: number
  maxMoves: number
  mainDeckCount: number
  onRestart: () => void
  onGoHome: () => void
}

export function GameHeader({ movesLeft, maxMoves, mainDeckCount, onRestart, onGoHome }: GameHeaderProps) {
  const isLow = movesLeft <= 10
  const isCritical = movesLeft <= 5

  return (
    <div className="w-full flex items-center justify-between px-2 py-2">
      {/* 左: メニューボタン */}
      <div className="min-w-[56px] flex justify-start">
        <GameMenu onRestart={onRestart} onGoHome={onGoHome} />
      </div>

      {/* 中央: 手数表示 */}
      <div
        className={`
          flex flex-col items-center px-6 py-1 rounded-xl shadow-lg
          ${isCritical ? 'bg-red-600' : isLow ? 'bg-orange-500' : 'bg-green-600'}
          transition-colors duration-300
        `}
        aria-label={`残り手数: ${movesLeft}`}
        role="status"
      >
        <span className="text-white/80 text-xs font-medium">残り手数</span>
        <span className={`text-white font-extrabold text-3xl leading-none ${isCritical ? 'animate-pulse' : ''}`}>
          {movesLeft}
        </span>
        <span className="text-white/60 text-xs">/ {maxMoves}</span>
      </div>

      {/* 右: 山札残数 */}
      <div className="flex flex-col items-center bg-green-900/60 rounded-lg px-3 py-1 min-w-[56px]">
        <span className="text-green-300 text-xs">山札</span>
        <span className="text-white font-bold text-lg leading-none">{mainDeckCount}</span>
      </div>
    </div>
  )
}
