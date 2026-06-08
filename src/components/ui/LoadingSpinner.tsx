'use client'

import React from 'react'

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  message?: string
}

export function LoadingSpinner({
  size = 'md',
  message = '読み込み中...',
}: LoadingSpinnerProps) {
  const sizes = {
    sm: 'w-6 h-6 border-2',
    md: 'w-10 h-10 border-4',
    lg: 'w-16 h-16 border-4',
  }

  return (
    <div className="flex flex-col items-center justify-center gap-3">
      <div
        className={`${sizes[size]} rounded-full border-white/30 border-t-white animate-spin`}
        role="status"
        aria-label="Loading"
      />
      {message && (
        <p className="text-white/80 text-sm">{message}</p>
      )}
    </div>
  )
}
