'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface GameMenuProps {
  onRestart: () => void
  onGoHome: () => void
}

export function GameMenu({ onRestart, onGoHome }: GameMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [volume, setVolume] = useState(70)

  const close = () => setIsOpen(false)

  return (
    <>
      {/* ハンバーガーボタン */}
      <button
        className="flex flex-col items-center justify-center gap-[5px] w-10 h-10
                   bg-black/25 backdrop-blur-sm rounded-xl border border-white/20
                   hover:bg-black/40 active:scale-95 transition-all"
        onClick={() => setIsOpen(true)}
        aria-label="メニューを開く"
      >
        <span className="w-5 h-0.5 bg-white rounded-full" />
        <span className="w-5 h-0.5 bg-white rounded-full" />
        <span className="w-5 h-0.5 bg-white rounded-full" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* 背景オーバーレイ */}
            <motion.div
              className="fixed inset-0 bg-black/50 z-40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={close}
            />

            {/* ドロワー */}
            <motion.div
              className="fixed top-0 left-0 h-full w-72 z-50 flex flex-col shadow-2xl"
              style={{ background: 'linear-gradient(160deg, #1a4731 0%, #0f2d1e 100%)' }}
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 220 }}
            >
              {/* ドロワーヘッダー */}
              <div className="flex items-center justify-between px-5 pt-10 pb-4 border-b border-white/10">
                <h2 className="text-white font-bold text-xl tracking-wide">メニュー</h2>
                <button
                  onClick={close}
                  className="w-8 h-8 flex items-center justify-center rounded-lg text-white/60
                             hover:text-white hover:bg-white/10 transition-all text-lg"
                  aria-label="メニューを閉じる"
                >
                  ✕
                </button>
              </div>

              {/* メニュー項目 */}
              <div className="flex-1 flex flex-col p-5 gap-2.5 overflow-y-auto">

                {/* リスタート */}
                <button
                  onClick={() => { onRestart(); close() }}
                  className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl
                             bg-white/10 hover:bg-white/20 active:scale-[0.98]
                             text-white transition-all text-left"
                >
                  <span className="text-2xl">🔄</span>
                  <div>
                    <p className="font-semibold text-sm">リスタート</p>
                    <p className="text-white/50 text-xs">このステージを最初からやり直す</p>
                  </div>
                </button>

                {/* タイトルへ戻る */}
                <button
                  onClick={() => { onGoHome(); close() }}
                  className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl
                             bg-white/10 hover:bg-white/20 active:scale-[0.98]
                             text-white transition-all text-left"
                >
                  <span className="text-2xl">🏠</span>
                  <div>
                    <p className="font-semibold text-sm">タイトルへ戻る</p>
                    <p className="text-white/50 text-xs">ステージ選択画面に戻る</p>
                  </div>
                </button>

                <div className="border-t border-white/10 my-1" />

                {/* 音量調整 */}
                <div className="px-4 py-3.5 rounded-2xl bg-white/10">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-2xl">
                      {volume === 0 ? '🔇' : volume < 40 ? '🔈' : volume < 80 ? '🔉' : '🔊'}
                    </span>
                    <div className="flex-1">
                      <p className="text-white font-semibold text-sm">BGM音量</p>
                    </div>
                    <span className="text-white/60 text-sm tabular-nums">{volume}%</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={volume}
                    onChange={(e) => setVolume(Number(e.target.value))}
                    className="w-full h-1.5 rounded-full accent-yellow-400 cursor-pointer"
                  />
                  <p className="text-white/30 text-xs mt-2.5">※ BGMは現在未実装です</p>
                </div>

                {/* SE音量 */}
                <div className="px-4 py-3.5 rounded-2xl bg-white/10">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-2xl">🎵</span>
                    <div className="flex-1">
                      <p className="text-white font-semibold text-sm">SE音量</p>
                    </div>
                    <span className="text-white/60 text-sm tabular-nums">{volume}%</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={volume}
                    onChange={(e) => setVolume(Number(e.target.value))}
                    className="w-full h-1.5 rounded-full accent-yellow-400 cursor-pointer"
                  />
                  <p className="text-white/30 text-xs mt-2.5">※ SEは現在未実装です</p>
                </div>

              </div>

              {/* フッター */}
              <div className="px-5 py-4 border-t border-white/10">
                <p className="text-white/25 text-xs text-center">Word Solitaire v0.1.0</p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
