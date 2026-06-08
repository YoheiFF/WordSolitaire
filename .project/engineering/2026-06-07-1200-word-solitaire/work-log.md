---
project_id: "2026-06-07-1200-word-solitaire"
phase: engineering
---

# 実装ログ

## 編集ファイル一覧

| ファイル | 操作 | 完了 | 備考 |
|---------|------|------|------|
| `package.json` | 新規作成 | ✅ | immerをビルドエラー後に追加 |
| `tsconfig.json` | 新規作成 | ✅ | |
| `next.config.ts` | 新規作成 | ✅ | BUILD_TARGET切り替え対応 |
| `postcss.config.mjs` | 新規作成 | ✅ | @tailwindcss/postcss |
| `drizzle.config.ts` | 新規作成 | ✅ | Turso/LibSQL設定 |
| `.gitignore` | 新規作成 | ✅ | |
| `.env.local.example` | 新規作成 | ✅ | TURSO_DATABASE_URL / TURSO_AUTH_TOKEN |
| `src/types/game.ts` | 新規作成 | ✅ | 設計書セクション4の全型定義。GameStateにtotalNormalCardsを追加（checkGameEnd用） |
| `src/lib/db/schema.ts` | 新規作成 | ✅ | Drizzle ORMスキーマ（設計書通り） |
| `src/lib/db/client.ts` | 新規作成 | ✅ | Lazy初期化（ビルド時のDB接続エラー回避のため設計書から変更） |
| `src/lib/db/seed.ts` | 新規作成 | ✅ | ステージ1の全データ（カテゴリ5件 + カード45件 + ステージ1 + stage_cards） |
| `src/lib/gameLogic.ts` | 新規作成 | ✅ | initGame, drawFromMainDeck, selectCard, placeToCategorySlotWithCategories, placeToColumn, checkGameEnd, undoLastAction, getHint |
| `src/lib/api.ts` | 新規作成 | ✅ | fetchStageList, fetchStageDetail, saveProgress |
| `src/store/gameStore.ts` | 新規作成 | ✅ | Zustand+immer, 履歴最大10件 |
| `src/app/api/stages/route.ts` | 新規作成 | ✅ | GET /api/stages（一覧・詳細）, force-dynamic |
| `src/app/api/progress/route.ts` | 新規作成 | ✅ | GET/POST /api/progress（UPSERT）, force-dynamic |
| `src/components/ui/Button.tsx` | 新規作成 | ✅ | primary/secondary/danger/ghost variant |
| `src/components/ui/Modal.tsx` | 新規作成 | ✅ | Framer Motionアニメーション付き |
| `src/components/ui/LoadingSpinner.tsx` | 新規作成 | ✅ | |
| `src/components/game/GameCard.tsx` | 新規作成 | ✅ | Framer Motion layoutId, 表/裏, ヒント状態 |
| `src/components/game/CategorySlot.tsx` | 新規作成 | ✅ | locked/empty/filled状態, タップで配置 |
| `src/components/game/CategoryRow.tsx` | 新規作成 | ✅ | 4スロット横並び |
| `src/components/game/MainDeck.tsx` | 新規作成 | ✅ | 山札（裏向き・枚数表示） |
| `src/components/game/CenterDeck.tsx` | 新規作成 | ✅ | 捨て山（表向き最上位カード） |
| `src/components/game/DeckArea.tsx` | 新規作成 | ✅ | 捨て山+山札エリア |
| `src/components/game/CardStack.tsx` | 新規作成 | ✅ | 各列スタック（末尾のみ表向き・選択可能） |
| `src/components/game/CardStackArea.tsx` | 新規作成 | ✅ | 4列スタックエリア |
| `src/components/game/GameHeader.tsx` | 新規作成 | ✅ | 手数表示バナー（10手以下でオレンジ、5手以下で赤） |
| `src/components/game/BoosterBar.tsx` | 新規作成 | ✅ | ヒント・アンドゥ・特殊（MVP: グレーアウト） |
| `src/components/game/GameContainer.tsx` | 新規作成 | ✅ | 全体コンテナ、クリア/失敗モーダル、進捗保存 |
| `src/app/globals.css` | 新規作成 | ✅ | @import "tailwindcss" (Tailwind v4形式) |
| `src/app/layout.tsx` | 新規作成 | ✅ | Viewport warningを修正（viewportをexportに分離） |
| `src/app/page.tsx` | 新規作成 | ✅ | ステージ選択画面 |
| `src/app/play/[stageId]/page.tsx` | 新規作成 | ✅ | ゲームプレイ画面 |
| `src/app/result/page.tsx` | 新規作成 | ✅ | 結果画面（useEffect内でリダイレクト） |

## 設計書からの変更・注記

| 項目 | 変更内容 | 理由 |
|------|----------|------|
| `GameState.totalNormalCards` | フィールドを追加 | checkGameEnd()で通常カード総数が必要だが、設計書のGameStateには含まれていなかった。保守的解釈で追加。 |
| `DB client` | Lazy初期化（Proxyパターン）に変更 | ビルド時にprocess.env.TURSO_DATABASE_URLがundefinedになりLibsqlErrorが発生するため。設計書通りの直接initは本番環境でのみ機能する。 |
| `placeToCategorySlot` | `placeToCategorySlotWithCategories`を追加 | GameStateにカテゴリリストがないため、gameStoreから呼び出す際にallCategoriesを渡す設計に。設計書の矛盾点。 |
| `immer` | package.jsonに追加 | zustandのimmerミドルウェアが依存するが設計書の依存関係リストに記載なし。 |
| `API routes` | `export const dynamic = 'force-dynamic'` を追加 | Next.js 15のビルド時静的最適化でAPIルートがDB接続を試みるため。 |

## 全体サマリー

- 影響範囲: 35 ファイル（新規作成）
- 設計通り完了: 32 ファイル
- 部分完了・要相談: 3 ファイル（上記変更・注記参照）
- ビルド結果: `npm run build` 成功（TypeScriptエラー0件・警告0件）

## 次フェーズ（QA）への申し送り

### 要確認事項
1. **Turso DB接続**: `.env.local`を設定後、`npm run db:seed`でシードデータを投入すること
2. **gameLogic.ts の `placeToCategorySlot` stub**: この関数はgameStore内で`placeToCategorySlotWithCategories`として処理されており、直接呼び出し時はstateをそのまま返す（stub）。gameStoreを経由して使用すること
3. **初期カテゴリ解放ロジック**: `initGame`ではシャッフル後の各列・山札からカテゴリカードを探して最初の1列を解放する。列の中間にあるカテゴリカードも検索対象（末尾に限らない）

### テスト観点
- Turso DB接続後にAPIエンドポイントの動作確認
- ゲームプレイの基本フロー（山札めくり→選択→配置→クリア/失敗）の検証
- アンドゥ・ヒント機能の動作確認
- モバイル375px幅でのレイアウト確認
