'use client'

import React from 'react'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  children: React.ReactNode
}

export function Button({
  variant = 'primary',
  size = 'md',
  className = '',
  children,
  disabled,
  ...props
}: ButtonProps) {
  const base =
    'inline-flex items-center justify-center font-semibold rounded-lg transition-all duration-150 select-none'

  const variants = {
    primary: 'bg-green-600 text-white hover:bg-green-700 active:bg-green-800 shadow',
    secondary: 'bg-white text-green-800 border border-green-300 hover:bg-green-50 shadow',
    danger: 'bg-red-500 text-white hover:bg-red-600 active:bg-red-700 shadow',
    ghost: 'bg-transparent text-white hover:bg-white/10 active:bg-white/20',
  }

  const sizes = {
    sm: 'px-3 py-1.5 text-sm min-h-[36px]',
    md: 'px-4 py-2 text-base min-h-[44px]',
    lg: 'px-6 py-3 text-lg min-h-[52px]',
  }

  const disabledStyle = disabled ? 'opacity-50 cursor-not-allowed pointer-events-none' : 'cursor-pointer'

  return (
    <button
      {...props}
      disabled={disabled}
      className={`${base} ${variants[variant]} ${sizes[size]} ${disabledStyle} ${className}`}
    >
      {children}
    </button>
  )
}
