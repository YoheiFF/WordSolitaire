import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import type {
  GameState,
  StageData,
  PlayCard,
  CardSource,
  HintResult,
  CategoryData,
} from '@/types/game'
import {
  initGame,
  drawFromMainDeck,
  refreshDeck,
  selectCard,
  placeToCategorySlotWithCategories,
  placeToColumn,
  stackCardOnColumn,
  undoLastAction,
  getHint,
  checkGameEnd,
  resetFilledSlot,
  addMovesToGame,
  shuffleColumnCards,
} from '@/lib/gameLogic'

const MAX_HISTORY = 10

interface GameStore {
  // --- 状態 ---
  gameState: GameState | null
  isLoading: boolean
  error: string | null
  hint: HintResult | null
  // 全カテゴリリスト（placeToCategorySlot で使用）
  allCategories: CategoryData[]
  // カテゴリID → 通常カード枚数（バッジ表示用）
  categoryTotals: Record<number, number>

  // --- アクション ---
  initGame: (stageData: StageData) => void
  drawFromMainDeck: () => void
  refreshDeck: () => void
  selectCard: (card: PlayCard, source: CardSource) => void
  placeToCategorySlot: (slotIndex: number) => void
  placeToColumnStack: (columnIndex: number) => void
  stackCardOnColumn: (colIndex: number) => void
  undoLastAction: () => void
  useHint: () => void
  clearHint: () => void
  resetGame: () => void
  resetFilledSlot: (slotIndex: number) => void
  addMoves: (amount: number) => void
  shuffleColumns: () => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
}

interface GameStoreInternal extends GameStore {
  history: GameState[]
  stageData: StageData | null
}

export const useGameStore = create<GameStoreInternal>()(
  immer((set, get) => ({
    gameState: null,
    isLoading: false,
    error: null,
    hint: null,
    allCategories: [],
    categoryTotals: {},
    history: [],
    stageData: null,

    initGame: (stageData: StageData) => {
      const newState = initGame(stageData)
      // カテゴリID → 通常カード枚数マップを一度計算
      const totals: Record<number, number> = {}
      stageData.cards
        .filter((c) => c.type === 'normal' && c.categoryId !== null)
        .forEach((c) => {
          totals[c.categoryId!] = (totals[c.categoryId!] ?? 0) + 1
        })
      set((draft) => {
        draft.gameState = newState as unknown as typeof draft.gameState
        draft.history = []
        draft.allCategories = stageData.categories as unknown as typeof draft.allCategories
        draft.categoryTotals = totals
        draft.stageData = stageData as unknown as typeof draft.stageData
        draft.error = null
        draft.hint = null
      })
    },

    drawFromMainDeck: () => {
      const { gameState } = get()
      if (!gameState || gameState.status !== 'playing') return

      set((draft) => {
        // 履歴に現在の状態を積む（最大10件）
        const history = [...draft.history]
        if (history.length >= MAX_HISTORY) history.shift()
        history.push(JSON.parse(JSON.stringify(draft.gameState)))
        draft.history = history as unknown as typeof draft.history

        const newState = drawFromMainDeck(gameState)
        draft.gameState = newState as unknown as typeof draft.gameState
        draft.hint = null
      })
    },

    refreshDeck: () => {
      const { gameState } = get()
      if (!gameState || gameState.status !== 'playing') return

      set((draft) => {
        const history = [...draft.history]
        if (history.length >= MAX_HISTORY) history.shift()
        history.push(JSON.parse(JSON.stringify(draft.gameState)))
        draft.history = history as unknown as typeof draft.history

        const newState = refreshDeck(gameState)
        draft.gameState = newState as unknown as typeof draft.gameState
        draft.hint = null
      })
    },

    selectCard: (card: PlayCard, source: CardSource) => {
      const { gameState } = get()
      if (!gameState || gameState.status !== 'playing') return

      set((draft) => {
        const newState = selectCard(gameState, card, source)
        draft.gameState = newState as unknown as typeof draft.gameState
      })
    },

    placeToCategorySlot: (slotIndex: number) => {
      const { gameState, allCategories, stageData } = get()
      if (!gameState || gameState.status !== 'playing') return
      if (!gameState.selectedCard) return

      set((draft) => {
        // 履歴に積む
        const history = [...draft.history]
        if (history.length >= MAX_HISTORY) history.shift()
        history.push(JSON.parse(JSON.stringify(draft.gameState)))
        draft.history = history as unknown as typeof draft.history

        const allCards = stageData?.cards ?? []
        const newState = placeToCategorySlotWithCategories(
          gameState,
          slotIndex,
          allCategories,
          allCards
        )
        draft.gameState = newState as unknown as typeof draft.gameState
        draft.hint = null
      })
    },

    placeToColumnStack: (columnIndex: number) => {
      const { gameState } = get()
      if (!gameState || gameState.status !== 'playing') return
      if (!gameState.selectedCard) return

      set((draft) => {
        const history = [...draft.history]
        if (history.length >= MAX_HISTORY) history.shift()
        history.push(JSON.parse(JSON.stringify(draft.gameState)))
        draft.history = history as unknown as typeof draft.history

        const newState = placeToColumn(gameState, columnIndex)
        draft.gameState = newState as unknown as typeof draft.gameState
        draft.hint = null
      })
    },

    stackCardOnColumn: (colIndex: number) => {
      const { gameState, allCategories } = get()
      if (!gameState || gameState.status !== 'playing') return
      if (!gameState.selectedCard) return

      set((draft) => {
        const history = [...draft.history]
        if (history.length >= MAX_HISTORY) history.shift()
        history.push(JSON.parse(JSON.stringify(draft.gameState)))
        draft.history = history as unknown as typeof draft.history

        const newState = stackCardOnColumn(gameState, colIndex, allCategories)
        draft.gameState = newState as unknown as typeof draft.gameState
        draft.hint = null
      })
    },

    undoLastAction: () => {
      const { gameState, history } = get()
      if (!gameState) return

      set((draft) => {
        const { state: prevState, history: newHistory } = undoLastAction(
          gameState,
          history
        )
        draft.gameState = prevState as unknown as typeof draft.gameState
        draft.history = newHistory as unknown as typeof draft.history
        draft.hint = null
      })
    },

    useHint: () => {
      const { gameState } = get()
      if (!gameState || gameState.status !== 'playing') return

      const hintResult = getHint(gameState)
      if (hintResult) {
        set((draft) => {
          if (draft.gameState) {
            draft.gameState.hintUsed += 1
          }
          draft.hint = hintResult as unknown as typeof draft.hint
        })
      }
    },

    clearHint: () => {
      set((draft) => {
        draft.hint = null
      })
    },

    resetGame: () => {
      const { stageData } = get()
      if (!stageData) return
      const newState = initGame(stageData)
      set((draft) => {
        draft.gameState = newState as unknown as typeof draft.gameState
        draft.history = []
        draft.hint = null
        draft.error = null
      })
    },

    resetFilledSlot: (slotIndex: number) => {
      const { gameState } = get()
      if (!gameState || gameState.status !== 'playing') return
      const slot = gameState.categorySlots[slotIndex]
      if (!slot || slot.state !== 'filled') return

      set((draft) => {
        const newState = resetFilledSlot(gameState, slotIndex)
        draft.gameState = newState as unknown as typeof draft.gameState
      })
    },

    addMoves: (amount: number) => {
      const { gameState } = get()
      if (!gameState || gameState.status !== 'playing') return

      set((draft) => {
        const newState = addMovesToGame(gameState, amount)
        draft.gameState = newState as unknown as typeof draft.gameState
      })
    },

    shuffleColumns: () => {
      const { gameState } = get()
      if (!gameState || gameState.status !== 'playing') return

      set((draft) => {
        const newState = shuffleColumnCards(gameState)
        draft.gameState = newState as unknown as typeof draft.gameState
        draft.hint = null
      })
    },

    setLoading: (loading: boolean) => {
      set((draft) => {
        draft.isLoading = loading
      })
    },

    setError: (error: string | null) => {
      set((draft) => {
        draft.error = error
      })
    },
  }))
)

/** ゲーム状態セレクター */
export const selectGameState = (s: GameStoreInternal) => s.gameState
export const selectIsLoading = (s: GameStoreInternal) => s.isLoading
export const selectError = (s: GameStoreInternal) => s.error
export const selectHint = (s: GameStoreInternal) => s.hint
export const selectHistory = (s: GameStoreInternal) => s.history
