// src/types/game.ts

// =====================
// 基本Enum / ユニオン型
// =====================

/** カードの種別 */
export type CardType = 'normal' | 'category'

/** カードの表裏 */
export type CardFace = 'face_down' | 'face_up'

/** カテゴリスロットの状態 */
export type SlotState = 'locked' | 'empty' | 'filled'

/** ゲームのステータス */
export type GameStatus = 'playing' | 'cleared' | 'failed'

/** カードの取得元 */
export type CardSource =
  | { type: 'centerDeck' }
  | { type: 'columnStack'; col: number }

// =====================
// DBから取得するデータ構造
// =====================

/** 個別カード（DB由来） */
export interface CardData {
  id: number
  categoryId: number | null  // null = カテゴリカード自体
  text: string               // 表示テキスト（例: "破線", "利益"）
  type: CardType
}

/** カテゴリ（DB由来） */
export interface CategoryData {
  id: number
  name: string  // カテゴリ名（例: "柄", "利益"）
}

/** ステージ定義（APIから取得） */
export interface StageData {
  id: number
  name: string
  totalMoves: number
  cards: CardData[]          // このステージのカード一覧（シャッフル前）
  categories: CategoryData[] // このステージのカテゴリ一覧
}

// =====================
// ゲーム中の状態構造
// =====================

/** プレイ中のカード（ゲーム状態に含む） */
export interface PlayCard {
  instanceId: string   // ゲーム内ユニークID（UUIDv4）
  data: CardData
  face: CardFace
}

/** カテゴリスロット（4列分） */
export interface CategorySlot {
  columnIndex: number           // 0〜3
  state: SlotState
  category: CategoryData | null // filled/empty時のみセット
  placedCards: PlayCard[]       // このカテゴリに配置されたカード
  totalExpected: number         // このカテゴリの総カード数（"0/8" 表示用）
}

/** ゲーム全体の状態 */
export interface GameState {
  stageId: number
  movesLeft: number
  maxMoves: number
  mainDeck: PlayCard[]          // 右上の山札（裏向き）
  centerDeck: PlayCard[]        // 中央山札（表向きスタック、最後が最上位）
  columnStacks: PlayCard[][]    // 4列のカードスタック [col0, col1, col2, col3]
  categorySlots: CategorySlot[] // 4列のカテゴリスロット
  selectedCard: PlayCard | null // 選択中のカード
  selectedCardSource: CardSource | null
  status: GameStatus
  hintUsed: number              // ヒント使用回数
  maxHints: number              // ヒント最大使用回数（例: 3）
  totalNormalCards: number      // ステージの全通常カード枚数（クリア判定用）
}

// =====================
// ゲームロジック戻り値
// =====================

/** ヒント結果 */
export interface HintResult {
  card: PlayCard
  suggestedSlotIndex: number    // 配置すべきカテゴリスロットのインデックス
  message: string               // 例: "「利益」は利益カテゴリに配置できます"
}

/** 進捗保存ペイロード */
export interface SaveProgressPayload {
  playerId: string
  stageId: number
  cleared: boolean
  movesRemaining: number
}

// =====================
// API レスポンス型
// =====================

export interface StageListItem {
  id: number
  name: string
  totalMoves: number
}

export interface ProgressRecord {
  stageId: number
  cleared: boolean
  bestMovesRemaining: number | null
  playCount: number
}
