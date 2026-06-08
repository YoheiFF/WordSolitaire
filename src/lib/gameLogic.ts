/**
 * ゲームロジック純粋関数群
 * 副作用なし。Zustand storeから呼び出す。
 */
import type {
  StageData,
  GameState,
  PlayCard,
  CardSource,
  CategorySlot,
  HintResult,
} from '@/types/game'

// =====================
// ユーティリティ
// =====================

/** UUIDv4生成（crypto.randomUUID fallback） */
function generateUUID(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  // フォールバック: Math.random ベース
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

/** Fisher-Yatesシャッフル（イミュータブル） */
function fisherYatesShuffle<T>(arr: T[]): T[] {
  const shuffled = [...arr]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

/** 配列を N 列に均等配布（余りは先頭列から1枚ずつ） */
function distributeToColumns<T>(arr: T[], cols: number): T[][] {
  const result: T[][] = Array.from({ length: cols }, () => [])
  arr.forEach((item, idx) => {
    result[idx % cols].push(item)
  })
  return result
}

/**
 * ソースからカードを除去したGameStateを返す
 * ※ column末尾を除去後、新しい末尾を表向きにする
 */
function removeCardFromSource(
  state: GameState,
  card: PlayCard,
  source: CardSource
): GameState {
  if (source.type === 'centerDeck') {
    // 中央山札の最上位（最後尾）を削除
    const newCenterDeck = state.centerDeck.filter(
      (c) => c.instanceId !== card.instanceId
    )
    return { ...state, centerDeck: newCenterDeck }
  } else {
    // columnStack の末尾を削除し、新しい末尾を表向きにする
    const col = source.col
    const newColumn = state.columnStacks[col].filter(
      (c) => c.instanceId !== card.instanceId
    )
    // 新しい末尾カードを表向きにする
    if (newColumn.length > 0) {
      newColumn[newColumn.length - 1] = {
        ...newColumn[newColumn.length - 1],
        face: 'face_up',
      }
    }
    const newColumnStacks = state.columnStacks.map((stack, i) =>
      i === col ? newColumn : stack
    )
    return { ...state, columnStacks: newColumnStacks }
  }
}

// =====================
// ゲームロジック本体
// =====================

/**
 * ゲーム初期化
 * 全カードをシャッフルし、先頭8枚をメイン山札、残りを4列に均等配布する。
 * 全4スロットはカテゴリ未設定（locked）でスタート。
 * カテゴリカードは山札・場に混在しており、プレイヤーが見つけてスロットにセットする。
 */
export function initGame(stageData: StageData): GameState {
  // 1. 通常カードを分離（クリア判定用のカウントに使用）
  const normalCards = stageData.cards.filter((c) => c.type === 'normal')

  // 2. 全カードにinstanceIdを付与してPlayCardに変換（最初は全て裏向き）
  const allPlayCards: PlayCard[] = stageData.cards.map((card) => ({
    instanceId: generateUUID(),
    data: card,
    face: 'face_down' as const,
  }))

  // 3. Fisher-Yatesシャッフル
  const shuffled = fisherYatesShuffle(allPlayCards)

  // 4. 先頭8枚をメイン山札（裏向き）、残りを4列に均等配布
  const mainDeckCards = shuffled.slice(0, 8).map((c) => ({ ...c, face: 'face_down' as const }))
  const remaining = shuffled.slice(8)

  // 5. 残りを4列に均等配布
  const rawColumns = distributeToColumns(remaining, 4)

  // 6. 各列の末尾（最後）のカードを表向きにする
  const columnStacks: PlayCard[][] = rawColumns.map((col) => {
    if (col.length === 0) return col
    return col.map((card, idx) =>
      idx === col.length - 1
        ? { ...card, face: 'face_up' as const }
        : { ...card, face: 'face_down' as const }
    )
  })

  // 7. 全スロットをカテゴリ未設定（locked）で初期化
  // カテゴリカードが置かれると該当スロットが empty（通常カード受付可能）になる
  const categorySlots: CategorySlot[] = [0, 1, 2, 3].map((i) => {
    const cat = stageData.categories[i] ?? null
    const expected = cat
      ? normalCards.filter((c) => c.categoryId === cat.id).length
      : 0
    return {
      columnIndex: i,
      state: 'locked' as const,
      category: null,
      placedCards: [],
      totalExpected: expected,
    }
  })

  // 8. ゲーム開始時に一番左（slot 0）のカテゴリカードを自動配置してスロット0を開放する
  // 対象: stageData.categories[0] に対応するカテゴリカード
  // 探索優先順: 列末尾（表向き） → 列内全体 → 山札
  const slot0Cat = stageData.categories[0] ?? null
  let autoCard: PlayCard | null = null
  let autoFromCol = -1  // >= 0 なら列インデックス、-1 なら山札

  if (slot0Cat) {
    const matchesCat = (c: PlayCard) => c.data.type === 'category' && c.data.text === slot0Cat.name

    outer: for (const pass of ['tail', 'all'] as const) {
      for (let col = 0; col < columnStacks.length; col++) {
        const stack = columnStacks[col]
        const range = pass === 'tail' ? [stack.length - 1] : Array.from({ length: stack.length }, (_, i) => i)
        for (const i of range) {
          if (i >= 0 && matchesCat(stack[i])) {
            autoCard = stack[i]
            autoFromCol = col
            break outer
          }
        }
      }
    }
    if (!autoCard) {
      const di = mainDeckCards.findIndex(matchesCat)
      if (di >= 0) { autoCard = mainDeckCards[di]; autoFromCol = -1 }
    }
  }

  let finalMainDeck = mainDeckCards
  const finalColumnStacks = columnStacks.map((col) => [...col])
  const finalCategorySlots = categorySlots.map((s) => ({ ...s }))

  if (autoCard && slot0Cat) {
    // 常に slot 0 に配置
    finalCategorySlots[0] = { ...finalCategorySlots[0], state: 'empty', category: slot0Cat }
    if (autoFromCol >= 0) {
      const newCol = finalColumnStacks[autoFromCol].filter((c) => c.instanceId !== autoCard!.instanceId)
      if (newCol.length > 0) newCol[newCol.length - 1] = { ...newCol[newCol.length - 1], face: 'face_up' }
      finalColumnStacks[autoFromCol] = newCol
    } else {
      finalMainDeck = finalMainDeck.filter((c) => c.instanceId !== autoCard!.instanceId)
    }
  }

  return {
    stageId: stageData.id,
    movesLeft: stageData.totalMoves,
    maxMoves: stageData.totalMoves,
    mainDeck: finalMainDeck,
    centerDeck: [],
    columnStacks: finalColumnStacks,
    categorySlots: finalCategorySlots,
    selectedCard: null,
    selectedCardSource: null,
    status: 'playing',
    hintUsed: 0,
    maxHints: 3,
    totalNormalCards: normalCards.length,
  }
}

/**
 * 山札めくり
 * メイン山札の先頭を表向きにして中央山札に積む。手数-1。
 */
export function drawFromMainDeck(state: GameState): GameState {
  if (state.mainDeck.length === 0) return state
  if (state.movesLeft <= 0) return state

  const [drawnCard, ...remainingMainDeck] = state.mainDeck
  const flippedCard: PlayCard = { ...drawnCard, face: 'face_up' }

  const newState: GameState = {
    ...state,
    mainDeck: remainingMainDeck,
    centerDeck: [...state.centerDeck, flippedCard],
    movesLeft: state.movesLeft - 1,
    selectedCard: null,
    selectedCardSource: null,
  }

  return checkGameEnd(newState)
}

/**
 * カード選択
 * 既に同じカードを選択中なら選択解除。そうでなければ新たに選択。
 */
export function selectCard(
  state: GameState,
  card: PlayCard,
  source: CardSource
): GameState {
  if (state.selectedCard?.instanceId === card.instanceId) {
    return { ...state, selectedCard: null, selectedCardSource: null }
  }
  return { ...state, selectedCard: card, selectedCardSource: source }
}

/**
 * カテゴリスロットへの配置
 * gameStoreがallCategoriesを保持しているため、必ずplaceToCategorySlotWithCategoriesを使用する。
 */
export function placeToCategorySlotWithCategories(
  state: GameState,
  slotIndex: number,
  allCategories: import('@/types/game').CategoryData[]
): GameState {
  const card = state.selectedCard
  const source = state.selectedCardSource

  if (!card || !source) return state
  if (card.data.type !== 'category') return state

  const slot = state.categorySlots[slotIndex]
  if (slot.state !== 'locked') return state

  // カテゴリカードのtextに対応するカテゴリを特定
  const correspondingCategory = allCategories.find(
    (cat) => cat.name === card.data.text
  )
  if (!correspondingCategory) return state

  // スロットをemptyに解放
  const updatedSlots = state.categorySlots.map((s, i) =>
    i === slotIndex
      ? { ...s, state: 'empty' as const, category: correspondingCategory }
      : s
  )

  // ソースからカードを除去
  let newState = removeCardFromSource(state, card, source)
  newState = {
    ...newState,
    categorySlots: updatedSlots,
    selectedCard: null,
    selectedCardSource: null,
    // カテゴリカード配置は手数を消費しない
  }

  return checkGameEnd(newState)
}

/**
 * 列への配置
 * 通常カード（type='normal'）を解放済み（empty）カテゴリ列に配置する。手数-1。
 * 列スタックから選択した場合はグループ（selectedCard 以降の全カード）をまとめて配置する。
 */
export function placeToColumn(
  state: GameState,
  columnIndex: number
): GameState {
  const card = state.selectedCard
  const source = state.selectedCardSource

  if (!card || !source) return state
  if (card.data.type !== 'normal') return state

  const slot = state.categorySlots[columnIndex]
  if (slot.state !== 'empty') return state
  if (state.movesLeft <= 0) return state

  // グループを取得（列スタックから選択時は selectedCard 以降を全て）
  const group: PlayCard[] = (() => {
    if (source.type !== 'columnStack') return [card]
    const sourceCol = state.columnStacks[source.col]
    const idx = sourceCol.findIndex((c) => c.instanceId === card.instanceId)
    return idx >= 0 ? sourceCol.slice(idx) : [card]
  })()

  // グループ全カードのカテゴリ一致確認
  if (group.some((c) => c.data.categoryId !== slot.category?.id)) return state
  // スロットの空き確認
  if (slot.placedCards.length + group.length > slot.totalExpected) return state

  // グループをスロットに配置
  const updatedSlots = state.categorySlots.map((s, i) =>
    i === columnIndex
      ? { ...s, placedCards: [...s.placedCards, ...group.map((c) => ({ ...c, face: 'face_up' as const }))] }
      : s
  )

  // ソースからグループを除去
  let newState: GameState
  if (source.type === 'columnStack') {
    const sourceCol = state.columnStacks[source.col]
    const cutIdx = sourceCol.findIndex((c) => c.instanceId === card.instanceId)
    if (cutIdx < 0) return state
    const remaining = sourceCol.slice(0, cutIdx).map((c, i, arr) =>
      i === arr.length - 1 ? { ...c, face: 'face_up' as const } : c
    )
    const newCols = state.columnStacks.map((s, i) => (i === source.col ? remaining : s))
    newState = { ...state, columnStacks: newCols }
  } else {
    newState = removeCardFromSource(state, card, source)
  }

  newState = {
    ...newState,
    categorySlots: updatedSlots,
    movesLeft: state.movesLeft - 1,
    selectedCard: null,
    selectedCardSource: null,
  }

  return checkGameEnd(newState)
}

/**
 * 列スタックへの積み重ね
 * ・同じカテゴリの最上位カードを持つ列スタックに積む
 * ・空列にはどんな通常カードでも移動可能
 * ・列スタック選択時は選択カード以降のグループをまとめて移動する
 * 手数-1。
 */
export function stackCardOnColumn(
  state: GameState,
  colIndex: number
): GameState {
  const card = state.selectedCard
  const source = state.selectedCardSource

  if (!card || !source) return state
  if (card.data.type !== 'normal') return state
  if (source.type === 'columnStack' && source.col === colIndex) return state
  if (state.movesLeft <= 0) return state

  const targetCol = state.columnStacks[colIndex]

  // 非空列: 最上位カードとカテゴリが一致する必要がある
  if (targetCol.length > 0) {
    const topCard = targetCol[targetCol.length - 1]
    if (topCard.data.categoryId !== card.data.categoryId) return state
  }

  // グループ取得: 列スタック選択時は selectedCard 以降を全部まとめる
  const group: PlayCard[] = (() => {
    if (source.type !== 'columnStack') return [card]
    const sourceCol = state.columnStacks[source.col]
    const idx = sourceCol.findIndex((c) => c.instanceId === card.instanceId)
    return idx >= 0 ? sourceCol.slice(idx) : [card]
  })()

  // ソース列からグループを除去（列スタックの場合は一括除去）
  let newState: GameState
  if (source.type === 'columnStack') {
    const sourceCol = state.columnStacks[source.col]
    const cutIdx = sourceCol.findIndex((c) => c.instanceId === card.instanceId)
    if (cutIdx < 0) return state  // selectedCardがソース列に存在しない場合は安全リターン
    const remaining = sourceCol.slice(0, cutIdx).map((c, i, arr) =>
      i === arr.length - 1 ? { ...c, face: 'face_up' as const } : c
    )
    const newCols = state.columnStacks.map((s, i) => (i === source.col ? remaining : s))
    newState = { ...state, columnStacks: newCols }
  } else {
    newState = removeCardFromSource(state, card, source)
  }

  // グループをターゲット列に追加（全て表向き）
  const groupFaceUp = group.map((c) => ({ ...c, face: 'face_up' as const }))
  const updatedCols = newState.columnStacks.map((s, i) =>
    i === colIndex ? [...s, ...groupFaceUp] : s
  )
  newState = {
    ...newState,
    columnStacks: updatedCols,
    movesLeft: state.movesLeft - 1,
    selectedCard: null,
    selectedCardSource: null,
  }

  return checkGameEnd(newState)
}

/**
 * クリア・失敗判定
 * 各アクションの末尾で呼び出す。
 */
export function checkGameEnd(state: GameState): GameState {
  const totalPlaced = state.categorySlots.reduce(
    (sum, s) => sum + s.placedCards.length,
    0
  )

  // 全通常カードが配置されている → クリア判定
  if (totalPlaced === state.totalNormalCards) {
    // 全て正しいカテゴリに置かれているかチェック
    const allCorrect = state.categorySlots.every((slot) =>
      slot.placedCards.every((c) => c.data.categoryId === slot.category?.id)
    )
    if (allCorrect) {
      return { ...state, status: 'cleared' }
    }
    // 不正解あり: ゲーム継続（プレイヤーが入れ替え可能な仕様）
  }

  // 手数0で未配置カードあり → 失敗
  if (state.movesLeft <= 0 && totalPlaced < state.totalNormalCards) {
    return { ...state, status: 'failed' }
  }

  // 山札・場が全て空で未配置カードあり → 失敗（詰み）
  if (
    state.mainDeck.length === 0 &&
    state.centerDeck.length === 0 &&
    state.columnStacks.every((col) => col.length === 0) &&
    totalPlaced < state.totalNormalCards
  ) {
    return { ...state, status: 'failed' }
  }

  // デッドロック検知: 山札空 & 裏向きカードなし & 全表向きカードに有効手なし
  if (state.mainDeck.length === 0 && totalPlaced < state.totalNormalCards) {
    const hasFaceDownInStacks = state.columnStacks.some((col) =>
      col.some((c) => c.face === 'face_down')
    )
    if (!hasFaceDownInStacks) {
      const faceUpCards: PlayCard[] = []
      if (state.centerDeck.length > 0) {
        const t = state.centerDeck[state.centerDeck.length - 1]
        if (t.face === 'face_up') faceUpCards.push(t)
      }
      for (const col of state.columnStacks) {
        if (col.length > 0 && col[col.length - 1].face === 'face_up') {
          faceUpCards.push(col[col.length - 1])
        }
      }
      if (faceUpCards.length > 0) {
        const hasValidMove = faceUpCards.some((card) => {
          if (card.data.type === 'category') {
            return state.categorySlots.some((s) => s.state === 'locked')
          }
          return state.categorySlots.some(
            (s) =>
              s.state === 'empty' &&
              s.category?.id === card.data.categoryId &&
              s.placedCards.length < s.totalExpected
          )
        })
        if (!hasValidMove) return { ...state, status: 'failed' }
      }
    }
  }

  return state
}

/**
 * アンドゥ
 * 履歴スタックから前のGameStateを復元する。
 */
export function undoLastAction(
  currentState: GameState,
  history: GameState[]
): { state: GameState; history: GameState[] } {
  if (history.length === 0) {
    return { state: currentState, history: [] }
  }
  const previousState = history[history.length - 1]
  const newHistory = history.slice(0, -1)
  return { state: previousState, history: newHistory }
}

/**
 * ヒント
 * 中央山札・各列末尾の表向きカードから、正しいカテゴリに配置できる手を提示する。
 */
export function getHint(state: GameState): HintResult | null {
  if (state.hintUsed >= state.maxHints) return null

  // 候補カードを収集
  const candidates: { card: PlayCard; source: CardSource }[] = []

  if (state.centerDeck.length > 0) {
    const lastCard = state.centerDeck[state.centerDeck.length - 1]
    candidates.push({ card: lastCard, source: { type: 'centerDeck' } })
  }

  state.columnStacks.forEach((col, i) => {
    if (col.length > 0) {
      const lastCard = col[col.length - 1]
      candidates.push({ card: lastCard, source: { type: 'columnStack', col: i } })
    }
  })

  // 配置可能な手を探す
  for (const candidate of candidates) {
    if (candidate.card.data.type === 'category') {
      // カテゴリカードならlockedスロットに配置できる
      const lockedSlot = state.categorySlots.find((s) => s.state === 'locked')
      if (lockedSlot) {
        return {
          card: candidate.card,
          suggestedSlotIndex: lockedSlot.columnIndex,
          message: `「${candidate.card.data.text}」を新しいカテゴリとして配置できます`,
        }
      }
    }

    if (candidate.card.data.type === 'normal') {
      // 通常カードの正しいカテゴリスロットを探す
      const correctSlot = state.categorySlots.find(
        (s) =>
          s.state === 'empty' &&
          s.category?.id === candidate.card.data.categoryId
      )
      if (correctSlot && correctSlot.category) {
        return {
          card: candidate.card,
          suggestedSlotIndex: correctSlot.columnIndex,
          message: `「${candidate.card.data.text}」は「${correctSlot.category.name}」カテゴリに配置できます`,
        }
      }
    }
  }

  return null
}
