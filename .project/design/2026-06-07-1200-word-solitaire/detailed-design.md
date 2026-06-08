---
project_id: "2026-06-07-1200-word-solitaire"
phase: design
doc_type: detailed-design
created: "2026-06-07"
---

# 詳細設計書: ワードソリティア

---

## 1. 概要

ワードソリティアは日本語カードを4列のカテゴリに仕分けするパズルゲームである。
本設計書はClaudeCode（実装エージェント）が設計書のみを読んで実装できる粒度で記述する。

### 実装対象
- Next.js 15 (App Router) + TypeScript ベースのWebアプリケーション
- Turso (LibSQL) + Drizzle ORM によるDB管理
- Zustand による状態管理
- Framer Motion によるカードアニメーション
- Vercel ホスティング

### 実装方針
- ゲームロジックは純粋関数として `src/lib/gameLogic.ts` に集約する（テスト容易性）
- UIコンポーネントはZustandストアを通じて状態を読み書きする
- APIルートはDB操作のみに特化する（ゲームロジックをAPIに持ち込まない）

---

## 2. 影響範囲（全て新規作成ファイル一覧）

```
# プロジェクトルート設定ファイル
C:\project\WordSolitaire\package.json
C:\project\WordSolitaire\tsconfig.json
C:\project\WordSolitaire\next.config.ts
C:\project\WordSolitaire\tailwind.config.ts
C:\project\WordSolitaire\drizzle.config.ts
C:\project\WordSolitaire\.env.local          ※ .gitignore対象
C:\project\WordSolitaire\.gitignore

# アプリケーション
C:\project\WordSolitaire\src\app\layout.tsx
C:\project\WordSolitaire\src\app\globals.css
C:\project\WordSolitaire\src\app\page.tsx
C:\project\WordSolitaire\src\app\play\[stageId]\page.tsx
C:\project\WordSolitaire\src\app\result\page.tsx
C:\project\WordSolitaire\src\app\api\stages\route.ts
C:\project\WordSolitaire\src\app\api\progress\route.ts

# コンポーネント
C:\project\WordSolitaire\src\components\game\GameContainer.tsx
C:\project\WordSolitaire\src\components\game\GameHeader.tsx
C:\project\WordSolitaire\src\components\game\DeckArea.tsx
C:\project\WordSolitaire\src\components\game\MainDeck.tsx
C:\project\WordSolitaire\src\components\game\CenterDeck.tsx
C:\project\WordSolitaire\src\components\game\CategoryRow.tsx
C:\project\WordSolitaire\src\components\game\CategorySlot.tsx
C:\project\WordSolitaire\src\components\game\CardStackArea.tsx
C:\project\WordSolitaire\src\components\game\CardStack.tsx
C:\project\WordSolitaire\src\components\game\GameCard.tsx
C:\project\WordSolitaire\src\components\game\BoosterBar.tsx
C:\project\WordSolitaire\src\components\ui\Button.tsx
C:\project\WordSolitaire\src\components\ui\Modal.tsx
C:\project\WordSolitaire\src\components\ui\LoadingSpinner.tsx

# 状態管理
C:\project\WordSolitaire\src\store\gameStore.ts

# ライブラリ・ユーティリティ
C:\project\WordSolitaire\src\lib\db\client.ts
C:\project\WordSolitaire\src\lib\db\schema.ts
C:\project\WordSolitaire\src\lib\db\seed.ts
C:\project\WordSolitaire\src\lib\api.ts
C:\project\WordSolitaire\src\lib\gameLogic.ts

# 型定義
C:\project\WordSolitaire\src\types\game.ts
```

---

## 3. ファイル別詳細

### 3.1 `src/types/game.ts`
**役割**: ゲーム全体で使用するTypeScript型定義を一元管理する

型定義はセクション4を参照。

---

### 3.2 `src/lib/db/schema.ts`
**役割**: Drizzle ORM のスキーマ定義（テーブル構造の宣言）

```typescript
import { sqliteTable, text, integer, primaryKey } from 'drizzle-orm/sqlite-core'

export const categories = sqliteTable('categories', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  createdAt: text('created_at').default(new Date().toISOString()),
})

export const cards = sqliteTable('cards', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  categoryId: integer('category_id').references(() => categories.id),  // NULL=カテゴリカード
  text: text('text').notNull(),
  type: text('type', { enum: ['normal', 'category'] }).notNull(),
  createdAt: text('created_at').default(new Date().toISOString()),
})

export const stages = sqliteTable('stages', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  totalMoves: integer('total_moves').notNull(),
  createdAt: text('created_at').default(new Date().toISOString()),
})

export const stageCards = sqliteTable('stage_cards', {
  stageId: integer('stage_id').notNull().references(() => stages.id),
  cardId: integer('card_id').notNull().references(() => cards.id),
}, (table) => ({
  pk: primaryKey({ columns: [table.stageId, table.cardId] }),
}))

export const playerProgress = sqliteTable('player_progress', {
  playerId: text('player_id').notNull(),
  stageId: integer('stage_id').notNull().references(() => stages.id),
  cleared: integer('cleared').notNull().default(0),
  bestMovesRemaining: integer('best_moves_remaining'),
  playCount: integer('play_count').notNull().default(0),
  updatedAt: text('updated_at').default(new Date().toISOString()),
}, (table) => ({
  pk: primaryKey({ columns: [table.playerId, table.stageId] }),
}))
```

---

### 3.3 `src/lib/db/client.ts`
**役割**: Turso LibSQL クライアントの初期化（シングルトン）

```typescript
import { createClient } from '@libsql/client'
import { drizzle } from 'drizzle-orm/libsql'
import * as schema from './schema'

const client = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN,
})

export const db = drizzle(client, { schema })
```

---

### 3.4 `src/lib/gameLogic.ts`
**役割**: ゲームロジックの純粋関数群（副作用なし、Zustand storeから呼び出す）

詳細はセクション5（ゲームロジック詳細）を参照。

---

### 3.5 `src/lib/api.ts`
**役割**: APIフェッチ関数（Web/モバイル共通）

```typescript
const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? ''

export async function fetchStageList(): Promise<{ id: number; name: string; totalMoves: number }[]>
export async function fetchStageDetail(stageId: number): Promise<StageData>
export async function saveProgress(data: SaveProgressPayload): Promise<void>

type SaveProgressPayload = {
  playerId: string
  stageId: number
  cleared: boolean
  movesRemaining: number
}
```

---

### 3.6 `src/store/gameStore.ts`
**役割**: Zustandによるゲーム状態管理（詳細はセクション4・5参照）

- `immer` ミドルウェアで不変更新を行う
- アンドゥ用の `history: GameState[]` を最大10件保持
- 各アクション末尾で `checkGameEnd()` を呼び出す

---

### 3.7 `src/app/api/stages/route.ts`
**役割**: ステージデータ取得APIエンドポイント

- `GET /api/stages`: ステージ一覧（id, name, totalMoves）を返す
- `GET /api/stages?id={stageId}`: 指定ステージの詳細（カード・カテゴリ含む）を返す
- DB: `stages` + `stage_cards` + `cards` + `categories` をJOINして取得

---

### 3.8 `src/app/api/progress/route.ts`
**役割**: プレイヤー進捗の取得・保存APIエンドポイント

- `GET /api/progress?playerId={uuid}`: プレイヤーの全ステージ進捗を返す
- `POST /api/progress`: 進捗を保存（UPSERT: 既存あれば更新、なければ挿入）

---

### 3.9 `src/app/play/[stageId]/page.tsx`
**役割**: ゲームプレイ画面

```typescript
// Client Component
'use client'

// 処理フロー:
// 1. useParams で stageId を取得
// 2. useEffect で fetchStageDetail(stageId) を呼び出す
// 3. データ取得後、gameStore.initGame(stageData) を呼び出す
// 4. ローディング中は LoadingSpinner を表示
// 5. エラー時はエラーメッセージを表示
// 6. データ準備完了後は GameContainer を表示
```

---

### 3.10 `src/components/game/GameCard.tsx`
**役割**: 個別カードのUI・アニメーション

- Props: `card: PlayCard | null`, `isSelectable: boolean`, `isSelected: boolean`, `onClick: () => void`
- `face === 'face_up'` のとき: テキスト表示。type='category' は背景色を変える（例: 青みがかった背景）
- `face === 'face_down'` のとき: カード背面デザイン（柄付き）
- Framer Motion: `layoutId={card.instanceId}` でカード移動アニメーション
- 選択中: ボーダー強調（黄色・太め）
- タップ可能: `cursor-pointer hover:scale-105` のホバーエフェクト

---

## 4. データ型定義（TypeScript型 全量）

```typescript
// src/types/game.ts

// =====================
// 基本Enum / ユニオン型
// =====================

/** カードの種別 */
type CardType = 'normal' | 'category'

/** カードの表裏 */
type CardFace = 'face_down' | 'face_up'

/** カテゴリスロットの状態 */
type SlotState = 'locked' | 'empty' | 'filled'

/** ゲームのステータス */
type GameStatus = 'playing' | 'cleared' | 'failed'

/** カードの取得元 */
type CardSource =
  | { type: 'centerDeck' }
  | { type: 'columnStack'; col: number }

// =====================
// DBから取得するデータ構造
// =====================

/** 個別カード（DB由来） */
interface CardData {
  id: number
  categoryId: number | null  // null = カテゴリカード自体
  text: string               // 表示テキスト（例: "破線", "利益"）
  type: CardType
}

/** カテゴリ（DB由来） */
interface CategoryData {
  id: number
  name: string  // カテゴリ名（例: "柄", "利益"）
}

/** ステージ定義（APIから取得） */
interface StageData {
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
interface PlayCard {
  instanceId: string   // ゲーム内ユニークID（UUIDv4）
  data: CardData
  face: CardFace
}

/** カテゴリスロット（4列分） */
interface CategorySlot {
  columnIndex: number           // 0〜3
  state: SlotState
  category: CategoryData | null // filled時のみセット
  placedCards: PlayCard[]       // このカテゴリに配置されたカード
  totalExpected: number         // このカテゴリの総カード数（"0/8" 表示用）
}

/** ゲーム全体の状態 */
interface GameState {
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
}

// =====================
// ゲームロジック戻り値
// =====================

/** ヒント結果 */
interface HintResult {
  card: PlayCard
  suggestedSlotIndex: number    // 配置すべきカテゴリスロットのインデックス
  message: string               // 例: "「利益」は利益カテゴリに配置できます"
}

/** 進捗保存ペイロード */
interface SaveProgressPayload {
  playerId: string
  stageId: number
  cleared: boolean
  movesRemaining: number
}

// =====================
// API レスポンス型
// =====================

interface StageListItem {
  id: number
  name: string
  totalMoves: number
}

interface ProgressRecord {
  stageId: number
  cleared: boolean
  bestMovesRemaining: number | null
  playCount: number
}
```

---

## 5. ゲームロジック詳細

### 5.1 ゲーム初期化 `initGame(stageData: StageData): GameState`

```
FUNCTION initGame(stageData):
  // 1. カテゴリカードと通常カードを分離
  categoryCards = stageData.cards.filter(c => c.type === 'category')
  normalCards   = stageData.cards.filter(c => c.type === 'normal')

  // 2. 全カードにinstanceId（UUIDv4）を付与してPlayCardに変換
  allPlayCards = [...categoryCards, ...normalCards].map(card => ({
    instanceId: generateUUID(),
    data: card,
    face: 'face_down'
  }))

  // 3. Fisher-Yatesアルゴリズムでシャッフル
  shuffled = fisherYatesShuffle(allPlayCards)

  // 4. 4列スタックに均等配布（各列の枚数は floor(total/4)、余りは先頭列から1枚ずつ追加）
  // 例: 40枚 → 各10枚。44枚 → [11, 11, 11, 11]
  columnStacks = distributeToColumns(shuffled, 4)

  // 5. 各スタックの一番下（末尾）のカードを表向きにする
  FOR each column in columnStacks:
    column[column.length - 1].face = 'face_up'

  // 6. カテゴリスロット初期化: 4列全てlockedでスタート
  categorySlots = [0, 1, 2, 3].map(i => ({
    columnIndex: i,
    state: 'locked',
    category: null,
    placedCards: [],
    totalExpected: normalCards.filter(c => c.categoryId === stageData.categories[i]?.id).length
  }))

  // 7. 最初の1列にカテゴリカードを配置してemptyに解放
  // columnStacks[0]の中から最初のカテゴリカードを取り出し、slot[0]に配置
  firstCategoryCard = findAndRemoveCategoryCard(columnStacks[0])
  IF firstCategoryCard exists:
    correspondingCategory = stageData.categories.find(cat =>
      firstCategoryCard.data.text === cat.name  // カテゴリカードのtextはカテゴリ名と一致
    )
    categorySlots[0] = {
      ...categorySlots[0],
      state: 'empty',
      category: correspondingCategory
    }

  // 8. メイン山札（右上）: columnStacksから取り出せなかったカードを山札に積む
  // ※今回の設計では山札は別途設ける
  // 初期配置: 全カードをスタックに配布し、山札は空（めくりは場のカードのみ）
  // → 実装を簡略化: 山札は全シャッフルカードの最初の N 枚（例: 8枚）をメイン山札に
  //   残りを4列に配布する

  // 実装方針（再定義）:
  // - 全カード（40〜48枚）をシャッフル
  // - 先頭8枚 → mainDeck（裏向き）
  // - 残り → 4列スタックに均等配布
  // - 各列の末尾1枚を表向き
  // - 4カテゴリカードはスタック内に混入

  RETURN new GameState {
    stageId: stageData.id,
    movesLeft: stageData.totalMoves,
    maxMoves: stageData.totalMoves,
    mainDeck: firstN(shuffled, 8).map(c => ({...c, face: 'face_down'})),
    centerDeck: [],
    columnStacks: distribute(shuffled.slice(8), 4),  // 各列末尾を表向き
    categorySlots: [...初期スロット（全locked、1列目はempty）],
    selectedCard: null,
    selectedCardSource: null,
    status: 'playing',
    hintUsed: 0,
    maxHints: 3,
  }
```

### 5.2 山札めくり `drawFromMainDeck(state: GameState): GameState`

```
FUNCTION drawFromMainDeck(state):
  IF state.mainDeck.length === 0:
    RETURN state  // 山札が空なら何もしない

  IF state.movesLeft <= 0:
    RETURN state  // 手数0なら操作不可

  // 山札先頭を取り出す
  [drawnCard, ...remainingMainDeck] = state.mainDeck
  drawnCard.face = 'face_up'

  newState = {
    ...state,
    mainDeck: remainingMainDeck,
    centerDeck: [...state.centerDeck, drawnCard],
    movesLeft: state.movesLeft - 1,
    selectedCard: null,
    selectedCardSource: null,
  }

  RETURN checkGameEnd(newState)
```

### 5.3 カード選択 `selectCard(state: GameState, card: PlayCard, source: CardSource): GameState`

```
FUNCTION selectCard(state, card, source):
  // 既に同じカードを選択中なら選択解除
  IF state.selectedCard?.instanceId === card.instanceId:
    RETURN { ...state, selectedCard: null, selectedCardSource: null }

  // 新しいカードを選択
  RETURN {
    ...state,
    selectedCard: card,
    selectedCardSource: source,
  }
```

### 5.4 カテゴリスロットへの配置 `placeToCategorySlot(state: GameState, slotIndex: number): GameState`

```
FUNCTION placeToCategorySlot(state, slotIndex):
  card = state.selectedCard
  source = state.selectedCardSource

  IF card === null: RETURN state
  IF card.data.type !== 'category': RETURN state  // カテゴリカードのみ配置可

  slot = state.categorySlots[slotIndex]
  IF slot.state !== 'locked': RETURN state  // lockedスロットにのみ配置可（emptyはすでに使用中）
  // ※ 設計上、最初の1列はカテゴリカードをスタックから除去してemptyになる
  // プレイヤーが追加でカテゴリカードを得たら、locked→emptyにするためplaceToCategorySlotを呼ぶ

  // カテゴリカードのテキストに対応するカテゴリを特定
  correspondingCategory = findCategoryByCardText(card.data.text, state)

  IF correspondingCategory === null: RETURN state  // 対応カテゴリなし（エラーケース）

  // スロットをfilled→emptyに（カテゴリ配置完了で列が解放される）
  // ※ カテゴリカード自体はスロットのカテゴリを示すが、placedCardsには入らない
  updatedSlots = state.categorySlots.map((s, i) =>
    i === slotIndex
      ? { ...s, state: 'empty', category: correspondingCategory }
      : s
  )

  // ソースからカードを除去
  newState = removeCardFromSource(state, card, source)
  newState.categorySlots = updatedSlots
  newState.selectedCard = null
  newState.selectedCardSource = null
  // カテゴリカード配置は手数を消費しない（ルール確認: 消費する場合は -1 を追加）

  RETURN checkGameEnd(newState)
```

### 5.5 列への配置 `placeToColumn(state: GameState, columnIndex: number): GameState`

```
FUNCTION placeToColumn(state, columnIndex):
  card = state.selectedCard
  source = state.selectedCardSource

  IF card === null: RETURN state
  IF card.data.type !== 'normal': RETURN state  // 通常カードのみ

  slot = state.categorySlots[columnIndex]
  IF slot.state !== 'empty': RETURN state  // カテゴリが解放されていない列には置けない

  // カードを対応列に配置（正誤チェックはUI側で視覚フィードバックに使う）
  isCorrect = card.data.categoryId === slot.category?.id

  updatedSlots = state.categorySlots.map((s, i) =>
    i === columnIndex
      ? { ...s, placedCards: [...s.placedCards, {...card, isCorrect}] }
      : s
  )

  newState = removeCardFromSource(state, card, source)
  newState.categorySlots = updatedSlots
  newState.movesLeft = state.movesLeft - 1
  newState.selectedCard = null
  newState.selectedCardSource = null

  RETURN checkGameEnd(newState)
```

### 5.6 クリア・失敗判定 `checkGameEnd(state: GameState): GameState`

```
FUNCTION checkGameEnd(state):
  // 全カードが配置済みかチェック
  totalPlaced = sum(state.categorySlots.map(s => s.placedCards.length))
  totalNormalCards = 全通常カード枚数（stageData由来）

  // 全通常カードが配置されている → クリア
  IF totalPlaced === totalNormalCards:
    // さらに全て正しいカテゴリに置かれているかチェック
    allCorrect = state.categorySlots.every(slot =>
      slot.placedCards.every(c => c.data.categoryId === slot.category?.id)
    )
    IF allCorrect:
      RETURN { ...state, status: 'cleared' }
    // 不正解がある場合は続行（プレイヤーが入れ替えできる仕様の場合）
    // MVP: 誤配置は即座に視覚フィードバックのみ、ゲーム継続

  // 手数0で未配置カードあり → 失敗
  IF state.movesLeft <= 0 AND totalPlaced < totalNormalCards:
    RETURN { ...state, status: 'failed' }

  // 山札・場が全て空で未配置カードあり → 失敗（詰み）
  IF state.mainDeck.length === 0
     AND state.centerDeck.length === 0
     AND state.columnStacks.every(col => col.length === 0)
     AND totalPlaced < totalNormalCards:
    RETURN { ...state, status: 'failed' }

  RETURN state  // ゲーム継続
```

### 5.7 アンドゥ `undoLastAction(state: GameState, history: GameState[]): { state: GameState, history: GameState[] }`

```
FUNCTION undoLastAction(currentState, history):
  IF history.length === 0:
    RETURN { state: currentState, history: [] }

  previousState = history[history.length - 1]
  newHistory = history.slice(0, -1)

  RETURN { state: previousState, history: newHistory }
```

### 5.8 ヒント `getHint(state: GameState): HintResult | null`

```
FUNCTION getHint(state):
  IF state.hintUsed >= state.maxHints:
    RETURN null  // ヒント残なし

  // 中央山札の最上位カードまたは各列末尾の表向きカードから1枚選ぶ
  candidates = []

  IF state.centerDeck.length > 0:
    candidates.push({ card: last(state.centerDeck), source: { type: 'centerDeck' } })

  FOR i, col in state.columnStacks:
    IF col.length > 0:
      candidates.push({ card: last(col), source: { type: 'columnStack', col: i } })

  // 正しいカテゴリスロットに配置できるカードを探す
  FOR candidate in candidates:
    IF candidate.card.data.type === 'category':
      // カテゴリカードならlockedスロットに配置できる
      lockedSlot = state.categorySlots.find(s => s.state === 'locked')
      IF lockedSlot:
        RETURN {
          card: candidate.card,
          suggestedSlotIndex: lockedSlot.columnIndex,
          message: `「${candidate.card.data.text}」を新しいカテゴリとして配置できます`
        }

    IF candidate.card.data.type === 'normal':
      // 通常カードの正しいカテゴリスロットを探す
      correctSlot = state.categorySlots.find(s =>
        s.state === 'empty' && s.category?.id === candidate.card.data.categoryId
      )
      IF correctSlot:
        RETURN {
          card: candidate.card,
          suggestedSlotIndex: correctSlot.columnIndex,
          message: `「${candidate.card.data.text}」は「${correctSlot.category.name}」カテゴリに配置できます`
        }

  RETURN null  // 有効なヒントなし
```

---

## 6. DBスキーマとDrizzle ORM定義

### 6.1 CREATE TABLE 相当（SQLite / LibSQL）

```sql
-- カテゴリテーブル
CREATE TABLE categories (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  name       TEXT    NOT NULL,
  created_at TEXT    DEFAULT (datetime('now'))
);

-- カードテーブル
CREATE TABLE cards (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  category_id INTEGER REFERENCES categories(id),  -- NULLはカテゴリカード自体
  text        TEXT    NOT NULL,
  type        TEXT    NOT NULL CHECK(type IN ('normal', 'category')),
  created_at  TEXT    DEFAULT (datetime('now'))
);

-- ステージテーブル
CREATE TABLE stages (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  name        TEXT    NOT NULL,
  total_moves INTEGER NOT NULL,
  created_at  TEXT    DEFAULT (datetime('now'))
);

-- ステージカード中間テーブル
CREATE TABLE stage_cards (
  stage_id INTEGER NOT NULL REFERENCES stages(id),
  card_id  INTEGER NOT NULL REFERENCES cards(id),
  PRIMARY KEY (stage_id, card_id)
);

-- プレイヤー進捗テーブル
CREATE TABLE player_progress (
  player_id            TEXT    NOT NULL,
  stage_id             INTEGER NOT NULL REFERENCES stages(id),
  cleared              INTEGER NOT NULL DEFAULT 0,
  best_moves_remaining INTEGER,
  play_count           INTEGER NOT NULL DEFAULT 0,
  updated_at           TEXT    DEFAULT (datetime('now')),
  PRIMARY KEY (player_id, stage_id)
);

-- インデックス
CREATE INDEX idx_cards_category_id ON cards(category_id);
CREATE INDEX idx_cards_type ON cards(type);
CREATE INDEX idx_stage_cards_stage_id ON stage_cards(stage_id);
CREATE INDEX idx_player_progress_player_id ON player_progress(player_id);
```

### 6.2 Drizzle ORM 型推論の活用

```typescript
// 型推論でDB行の型を自動生成
import { InferSelectModel, InferInsertModel } from 'drizzle-orm'
import * as schema from '@/lib/db/schema'

type CategoryRow = InferSelectModel<typeof schema.categories>
type CardRow = InferSelectModel<typeof schema.cards>
type StageRow = InferSelectModel<typeof schema.stages>
type PlayerProgressRow = InferSelectModel<typeof schema.playerProgress>
```

---

## 7. サンプルデータ（初期データ INSERT 例）

ステージ1用の初期データ。Tursoに投入する。

### 7.1 カテゴリ（5件）

```sql
INSERT INTO categories (name) VALUES
  ('柄'),       -- id=1
  ('利益'),     -- id=2
  ('フィット'), -- id=3
  ('三拍子'),   -- id=4
  ('音楽');     -- id=5
```

### 7.2 カード: カテゴリカード（各カテゴリ1枚、category_id=NULL）

```sql
INSERT INTO cards (category_id, text, type) VALUES
  (NULL, '柄',       'category'),  -- id=1
  (NULL, '利益',     'category'),  -- id=2
  (NULL, 'フィット', 'category'),  -- id=3
  (NULL, '三拍子',   'category'),  -- id=4
  (NULL, '音楽',     'category');  -- id=5
```

### 7.3 カード: 通常カード（各カテゴリ8枚 = 40枚）

```sql
-- 柄カテゴリ（category_id=1）: 模様・デザイン・パターンに関する単語
INSERT INTO cards (category_id, text, type) VALUES
  (1, '破線',   'normal'),  -- id=6
  (1, '水玉',   'normal'),  -- id=7
  (1, 'ギンガム', 'normal'), -- id=8
  (1, 'ストライプ', 'normal'), -- id=9
  (1, 'アーガイル', 'normal'), -- id=10
  (1, 'ペイズリー', 'normal'), -- id=11
  (1, 'ヘリンボーン', 'normal'), -- id=12
  (1, 'タータン', 'normal'); -- id=13

-- 利益カテゴリ（category_id=2）: 収益・経済・利得に関する単語
INSERT INTO cards (category_id, text, type) VALUES
  (2, '利益',   'normal'),  -- id=14
  (2, '収益',   'normal'),  -- id=15
  (2, '黒字',   'normal'),  -- id=16
  (2, '配当',   'normal'),  -- id=17
  (2, '純益',   'normal'),  -- id=18
  (2, '売上',   'normal'),  -- id=19
  (2, '増収',   'normal'),  -- id=20
  (2, '剰余',   'normal');  -- id=21

-- フィットカテゴリ（category_id=3）: 運動・フィットネスに関する単語
INSERT INTO cards (category_id, text, type) VALUES
  (3, 'ジョグ',   'normal'),  -- id=22
  (3, 'スクワット', 'normal'), -- id=23
  (3, 'プランク', 'normal'),  -- id=24
  (3, 'ランジ',   'normal'),  -- id=25
  (3, 'バーピー', 'normal'),  -- id=26
  (3, '懸垂',     'normal'),  -- id=27
  (3, 'ダッシュ', 'normal'),  -- id=28
  (3, 'ヨガ',     'normal');  -- id=29

-- 三拍子カテゴリ（category_id=4）: 3拍子の概念・ワルツ等に関する単語
INSERT INTO cards (category_id, text, type) VALUES
  (4, 'ワルツ',   'normal'),  -- id=30
  (4, 'ポルカ',   'normal'),  -- id=31
  (4, 'メヌエット', 'normal'), -- id=32
  (4, 'マズルカ', 'normal'),  -- id=33
  (4, 'サラバンド', 'normal'), -- id=34
  (4, 'ジーグ',   'normal'),  -- id=35
  (4, 'シャコンヌ', 'normal'), -- id=36
  (4, 'ブーレ',   'normal');  -- id=37

-- 音楽カテゴリ（category_id=5）: 音楽・楽器・音に関する単語
INSERT INTO cards (category_id, text, type) VALUES
  (5, 'フルート', 'normal'),  -- id=38
  (5, 'バイオリン', 'normal'), -- id=39
  (5, 'チェロ',   'normal'),  -- id=40
  (5, 'ハープ',   'normal'),  -- id=41
  (5, 'オーボエ', 'normal'),  -- id=42
  (5, 'クラリネット', 'normal'), -- id=43
  (5, 'ピッコロ', 'normal'),  -- id=44
  (5, 'トランペット', 'normal'); -- id=45
```

### 7.4 ステージ1の定義

```sql
-- ステージ定義（手数: 50手）
INSERT INTO stages (name, total_moves) VALUES
  ('ステージ1 - 音楽と模様の世界', 50);  -- id=1
```

### 7.5 ステージカード（ステージ1に使用するカード一覧）

ステージ1では「柄」「利益」「フィット」「三拍子」の4カテゴリ（32枚通常カード + 4枚カテゴリカード = 計36枚）を使用する。

```sql
-- ステージ1のカテゴリカード（id=1〜4: 柄・利益・フィット・三拍子）
INSERT INTO stage_cards (stage_id, card_id) VALUES
  (1, 1), (1, 2), (1, 3), (1, 4);

-- ステージ1の通常カード（柄: id=6〜13, 利益: id=14〜21, フィット: id=22〜29, 三拍子: id=30〜37）
INSERT INTO stage_cards (stage_id, card_id) VALUES
  (1, 6), (1, 7), (1, 8), (1, 9), (1, 10), (1, 11), (1, 12), (1, 13),
  (1, 14), (1, 15), (1, 16), (1, 17), (1, 18), (1, 19), (1, 20), (1, 21),
  (1, 22), (1, 23), (1, 24), (1, 25), (1, 26), (1, 27), (1, 28), (1, 29),
  (1, 30), (1, 31), (1, 32), (1, 33), (1, 34), (1, 35), (1, 36), (1, 37);
```

---

## 8. APIルート仕様

### 8.1 GET /api/stages

**説明**: 全ステージの一覧を返す

**リクエスト**: なし

**レスポンス**:
```json
[
  {
    "id": 1,
    "name": "ステージ1 - 音楽と模様の世界",
    "totalMoves": 50
  }
]
```

---

### 8.2 GET /api/stages?id={stageId}

**説明**: 指定ステージの詳細（カード・カテゴリ含む）を返す

**リクエストパラメータ**: `id` (number) - ステージID

**レスポンス**:
```json
{
  "id": 1,
  "name": "ステージ1 - 音楽と模様の世界",
  "totalMoves": 50,
  "categories": [
    { "id": 1, "name": "柄" },
    { "id": 2, "name": "利益" },
    { "id": 3, "name": "フィット" },
    { "id": 4, "name": "三拍子" }
  ],
  "cards": [
    { "id": 1, "categoryId": null, "text": "柄", "type": "category" },
    { "id": 6, "categoryId": 1, "text": "破線", "type": "normal" },
    ...
  ]
}
```

**エラーレスポンス**:
- `400 Bad Request`: id パラメータなし
- `404 Not Found`: 指定IDのステージが存在しない
- `500 Internal Server Error`: DB接続エラー

**実装詳細**:
```typescript
// src/app/api/stages/route.ts
import { db } from '@/lib/db/client'
import { stages, stageCards, cards, categories } from '@/lib/db/schema'
import { eq, inArray } from 'drizzle-orm'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')

  if (!id) {
    // 一覧取得
    const result = await db.select({
      id: stages.id,
      name: stages.name,
      totalMoves: stages.totalMoves,
    }).from(stages)
    return Response.json(result)
  }

  const stageId = parseInt(id)
  // 特定ステージ詳細取得（JOINでカード・カテゴリを一括取得）
  // ...省略（詳細はDrizzle ORM ドキュメント参照）
}
```

---

### 8.3 GET /api/progress?playerId={uuid}

**説明**: 指定プレイヤーの全ステージ進捗を返す

**リクエストパラメータ**: `playerId` (string) - プレイヤーUUID

**レスポンス**:
```json
[
  {
    "stageId": 1,
    "cleared": true,
    "bestMovesRemaining": 12,
    "playCount": 3
  }
]
```

---

### 8.4 POST /api/progress

**説明**: プレイヤーの進捗を保存（UPSERT）

**リクエストボディ**:
```json
{
  "playerId": "uuid-v4-string",
  "stageId": 1,
  "cleared": true,
  "movesRemaining": 12
}
```

**レスポンス**:
- `200 OK`: 保存成功 `{ "success": true }`
- `400 Bad Request`: バリデーションエラー
- `500 Internal Server Error`: DB接続エラー

**実装詳細（UPSERT）**:
```typescript
// Turso/LibSQLはSQLite互換なのでON CONFLICT DO UPDATEを使用
await db.insert(playerProgress)
  .values({
    playerId: body.playerId,
    stageId: body.stageId,
    cleared: body.cleared ? 1 : 0,
    bestMovesRemaining: body.movesRemaining,
    playCount: 1,
    updatedAt: new Date().toISOString(),
  })
  .onConflictDoUpdate({
    target: [playerProgress.playerId, playerProgress.stageId],
    set: {
      cleared: body.cleared ? 1 : 0,
      bestMovesRemaining: sql`CASE WHEN excluded.best_moves_remaining > best_moves_remaining THEN excluded.best_moves_remaining ELSE best_moves_remaining END`,
      playCount: sql`play_count + 1`,
      updatedAt: new Date().toISOString(),
    },
  })
```

---

## 9. テスト観点

### 9.1 ゲームロジック単体テスト（`src/lib/gameLogic.ts`）

| テスト項目 | テスト内容 | 期待結果 |
|-----------|-----------|---------|
| initGame | 正常なStageDataを渡す | GameStateが正しく初期化される |
| initGame | 4列にカードが均等配布される | 各列の枚数が正しい |
| initGame | 1列目のみカテゴリ解放済み | slots[0].state==='empty', slots[1〜3].state==='locked' |
| drawFromMainDeck | 山札残あり・手数残あり | カード1枚が中央山札に移動、手数-1 |
| drawFromMainDeck | 山札空の場合 | 状態変化なし |
| drawFromMainDeck | 手数0の場合 | 状態変化なし |
| selectCard | カードを選択 | selectedCardにカードがセットされる |
| selectCard | 同じカードを再選択 | selectedCardがnullになる（選択解除） |
| placeToCategorySlot | カテゴリカードをlockedスロットに配置 | スロットがemptyに変化 |
| placeToCategorySlot | 通常カードをスロットに配置しようとする | 状態変化なし |
| placeToColumn | 通常カードを正しいカテゴリ列に配置 | placedCardsにカードが追加、手数-1 |
| placeToColumn | emptyでない列に配置しようとする | 状態変化なし |
| checkGameEnd | 全カード配置済み・全て正解 | status==='cleared' |
| checkGameEnd | 手数0で未配置あり | status==='failed' |
| checkGameEnd | 山札・場全て空で未配置あり | status==='failed' |
| undoLastAction | 履歴あり | 1手前の状態に戻る |
| undoLastAction | 履歴なし | 状態変化なし |
| getHint | ヒント残あり・有効な手あり | HintResultが返される |
| getHint | ヒント残なし | nullが返される |

### 9.2 APIルート結合テスト

| エンドポイント | テスト内容 | 期待結果 |
|--------------|-----------|---------|
| GET /api/stages | DBにステージあり | 200とステージ一覧JSON |
| GET /api/stages?id=1 | ステージID=1が存在 | 200と詳細JSON（カード・カテゴリ含む） |
| GET /api/stages?id=999 | 存在しないID | 404 |
| POST /api/progress | 有効なボディ | 200と{ success: true } |
| POST /api/progress | 同一player+stageで2回目 | 200・playCount=2・bestMovesが更新される |
| POST /api/progress | 不正なボディ | 400 |

### 9.3 UIテスト観点

| 画面 | テスト項目 |
|------|-----------|
| ゲームプレイ | 山札をタップするとカードが中央に移動する |
| ゲームプレイ | スタックの末尾カードをタップすると選択状態になる |
| ゲームプレイ | カテゴリスロットをタップするとカードが配置される |
| ゲームプレイ | 手数が正しく表示・減算される |
| ゲームプレイ | アンドゥボタンで1手戻れる |
| ゲームプレイ | クリア時にクリア演出が表示される |
| ゲームプレイ | 失敗時に失敗モーダルが表示される |
| 結果画面 | リトライボタンでゲームが再スタートする |
| スタート画面 | ステージ一覧が表示される |
| モバイル | 375px幅で全要素がはみ出さず表示される |

---

## 10. 完了条件チェックリスト

### 環境・設定
- [ ] `package.json` が作成され `npm install` が成功する
- [ ] `next.config.ts` に `BUILD_TARGET` 切り替えが実装されている
- [ ] `.env.local` のテンプレートが `.env.example` として用意されている
- [ ] `drizzle.config.ts` が設定されている
- [ ] `drizzle-kit push` でTursoにスキーマが反映される

### DB・データ
- [ ] 全テーブルがTursoに作成されている（categories, cards, stages, stage_cards, player_progress）
- [ ] サンプルデータ（ステージ1の全カード36枚）がTursoに投入されている
- [ ] Drizzle ORM でスキーマ定義が型安全に記述されている

### API
- [ ] `GET /api/stages` がステージ一覧を返す
- [ ] `GET /api/stages?id=1` がステージ1の詳細（カード・カテゴリ含む）を返す
- [ ] `POST /api/progress` が進捗を保存（UPSERTが正しく動作）する
- [ ] エラーレスポンスが適切なステータスコードで返される

### ゲームロジック
- [ ] `initGame` でゲーム状態が正しく初期化される
- [ ] `drawFromMainDeck` で山札めくりが動作する
- [ ] `selectCard` / `placeToCategorySlot` / `placeToColumn` が正常動作する
- [ ] クリア・失敗判定が正しく動作する
- [ ] アンドゥが1手戻れる
- [ ] ヒントが有効な手を提示する

### UI
- [ ] スタート画面でステージ一覧が表示される
- [ ] ゲームプレイ画面のレイアウト（ヘッダー・山札・スロット・スタック・ブースター）が実装されている
- [ ] カードのタップ操作が正常に動作する
- [ ] Framer Motionによるカード移動アニメーションが動作する
- [ ] クリア・失敗のモーダルが表示される
- [ ] モバイル縦持ち（375px）で全要素が収まる

### 品質
- [ ] TypeScriptの型エラーが0件（`npm run build` 成功）
- [ ] `npm run build` でビルドが成功する
- [ ] Vercelにデプロイしてゲームがプレイできる
- [ ] `BUILD_TARGET=mobile npm run build` でstatid exportが成功する
