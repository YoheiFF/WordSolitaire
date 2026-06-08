import { create } from 'zustand'
import type { PlayCard } from '@/types/game'

interface DragState {
  cards: PlayCard[]  // ドラッグ中のグループ（複数枚対応）
  x: number
  y: number
  w: number
  h: number
  setDrag: (cards: PlayCard[], x: number, y: number, w: number, h: number) => void
  updatePos: (x: number, y: number) => void
  clearDrag: () => void
}

export const useDragStore = create<DragState>()((set) => ({
  cards: [],
  x: 0,
  y: 0,
  w: 60,
  h: 88,
  setDrag: (cards, x, y, w, h) => set({ cards, x, y, w, h }),
  updatePos: (x, y) => set({ x, y }),
  clearDrag: () => set({ cards: [] }),
}))
