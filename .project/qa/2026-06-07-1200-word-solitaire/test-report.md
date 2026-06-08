---
project_id: "2026-06-07-1200-word-solitaire"
phase: qa
overall_status: partial
---
# テストレポート（DB接続込み総合テスト）

実施日時: 2026-06-07  
QAエンジニア: Claude Code (QA)  
対象環境: http://localhost:3000  

---

## 総合判定

**partial（一部問題あり）**

APIテスト4本・ページ疎通3本はすべてPASS。DB接続込みの結合テストも正常動作を確認。
コードロジック検証においてデッドコード（stubのまま残存する関数）を1件検出。
動作上の影響はないが設計整合性・保守性に関わる課題として記録する。

---

## APIテスト結果

| # | エンドポイント | 期待値 | 実測値 | 判定 |
|---|---|---|---|---|
| 1 | GET /api/stages | ステージ配列（id, name, totalMoves） | `[{"id":1,"name":"ステージ1 - 音楽と模様の世界","totalMoves":50}]` | PASS |
| 2 | GET /api/stages?id=1 | cards配列36枚・categories配列4件 | cards: 36枚（normal 32枚 + category 4枚）, categories: 4件 | PASS |
| 3 | POST /api/progress | `{"success":true}` | `{"success":true}` | PASS |
| 4 | GET /api/progress?playerId=... | 保存した進捗データ | `[{"stageId":1,"cleared":true,"bestMovesRemaining":12,"playCount":1}]` | PASS |

**備考**:
- 設計書記載の「cards配列に36枚」と実測値36枚が一致。内訳は通常カード32枚＋カテゴリカード4枚。
- 進捗のUPSERT処理（onConflictDoUpdate）は正常動作確認済み。cleared/bestMovesRemainingは最良値保持、playCountは累計加算。

---

## コードロジック検証結果

### src/lib/gameLogic.ts

| 検証項目 | 期待する実装 | 判定 | 備考 |
|---|---|---|---|
| initGame: 全カードシャッフル | Fisher-Yatesシャッフル | PASS | fisherYatesShuffle関数として実装済み（L32-39） |
| initGame: 先頭8枚をメイン山札 | shuffled.slice(0,8) → mainDeck | PASS | L110-111で実装済み |
| initGame: 4列に均等配布 | distributeToColumns(remaining, 4) | PASS | L114で実装済み |
| initGame: 1列カテゴリ配置（スロット解放） | 列からカテゴリカードを探しスロット0をemptyに | PASS | L144-200で実装済み。列に見つからない場合はmainDeckも探索する追加実装あり |
| drawFromMainDeck: mainDeck→centerDeck移動 | mainDeckの先頭を取り出してcenterDeckに積む | PASS | L229-232で実装済み |
| drawFromMainDeck: movesLeft-1 | movesLeft: state.movesLeft - 1 | PASS | L233で実装済み |
| checkGameEnd: cleared判定 | totalPlaced === totalNormalCards かつ全正解カテゴリ | PASS | L390-398で実装済み |
| checkGameEnd: failed判定（手数0） | movesLeft <= 0 かつ未配置カードあり | PASS | L402-404で実装済み |
| checkGameEnd: failed判定（詰み） | 山札・場・列が全空 かつ未配置カードあり | PASS | L406-414で実装済み |
| placeToCategorySlot 本体 | カテゴリカードをlockedスロットに配置 | **WARN** | L293はstub（`return state` のみ）。詳細は「発見した問題・問題1」を参照 |

### src/store/gameStore.ts

| 検証項目 | アクション名 | 判定 | 備考 |
|---|---|---|---|
| initGame | initGame | PASS | stageData.categoriesをallCategoriesに保存し初期化 |
| drawFromMainDeck | drawFromMainDeck | PASS | 履歴保存＋gameLogic.drawFromMainDeck呼び出し |
| selectCard | selectCard | PASS | gameLogic.selectCard呼び出し |
| placeToCategorySlot | placeToCategorySlot | PASS | placeToCategorySlotWithCategories（拡張版）を正しく呼び出している |
| placeToColumn | placeToColumnStack（名称変更） | PASS | gameLogic.placeToColumn呼び出し |
| undoLastAction | undoLastAction | PASS | 履歴スタックから前の状態を復元、履歴なし時の安全処理あり |
| useHint | useHint | PASS | getHint呼び出し＋hintUsed+1 |

### src/app/play/[stageId]/page.tsx

| 検証項目 | 判定 | 備考 |
|---|---|---|
| /api/stages?id={stageId} からステージデータ取得 | PASS | lib/api.tsのfetchStageDetail(stageId)経由で呼び出し |
| GameContainerコンポーネント呼び出し | PASS | gameState取得後に `return <GameContainer />` |
| ローディング状態の表示（LoadingSpinner） | PASS | isLoading時にLoadingSpinner表示 |
| エラー状態の表示 | PASS | エラーメッセージ＋ホームへ戻るボタン |

### src/components/game/GameContainer.tsx

| 子コンポーネント | 配置 | 判定 |
|---|---|---|
| GameHeader | movesLeft, maxMoves, mainDeckCountをpropsで渡す | PASS |
| DeckArea | mainDeck, centerDeck, hintedCardInstanceIdをpropsで渡す | PASS |
| CategoryRow | categorySlots, hintedSlotIndexをpropsで渡す | PASS |
| CardStackArea | columnStacks, categorySlots, hintedCardInstanceIdをpropsで渡す | PASS |
| BoosterBar | hintUsed, maxHints, historyCountをpropsで渡す | PASS |
| クリアモーダル（Modal） | isCleared時に表示、ホームへ/もう一度ボタン | PASS |
| 失敗モーダル（Modal） | isFailed時に表示、ホームへ/リトライボタン | PASS |

---

## ページ疎通結果

| ページ | URL | HTTPステータス | 判定 |
|---|---|---|---|
| ホーム | http://localhost:3000 | 200 | PASS |
| ゲームプレイ | http://localhost:3000/play/1 | 200 | PASS |
| リザルト | http://localhost:3000/result | 200 | PASS |

---

## 発見した問題

### 問題1: `placeToCategorySlot`（gameLogic.ts）がstub実装のまま残存

**深刻度**: 低（動作上の影響なし）  
**ファイル**: `src/lib/gameLogic.ts` L263-294  

**内容**:  
`placeToCategorySlot` 関数（L263）の本体は `return state` のstubのみ。
コメント（L280-290）に設計書の矛盾（GameStateにcategoriesリストがないためカテゴリ特定不可）として説明が記載されており、
実際には同ファイルの `placeToCategorySlotWithCategories`（L300）が正式実装として機能している。
`gameStore.ts` は正しく `placeToCategorySlotWithCategories` を呼び出しているため**UIからの操作に実害はない**。

ただし、デッドコードとして残存しており以下のリスクがある:
- 将来的に単体テストを書く際に `placeToCategorySlot` を対象にすると常にstateが変わらずテストが誤検知する
- 他の開発者が `placeToCategorySlot` を直接呼び出してもバグを検出しにくい

**推奨対応**: `placeToCategorySlot` 関数を削除するか、deprecated注記を追加して `placeToCategorySlotWithCategories` に統一する。優先度: **低**。

---

## PMへの申し送り

1. **DB接続込み総合テスト完了**: API 4本・ページ 3本すべて正常動作。Turso DBシードデータ（ステージ1・カテゴリ5件・カード45件中ステージ1に36枚割り当て）との結合動作も確認済み。

2. **問題1（コード整理）**: `gameLogic.ts` の `placeToCategorySlot` stubの削除または非推奨化を推奨。技術的負債になる可能性がある。優先度: **低**。

3. **前回QAレポートとの差分**: 前回（静的検証フェーズ）でPASS判定だった問題2「placeToCategorySlotがstub実装」を本テストでも再確認。前回指摘のDB未接続（問題4）は本テストで解消済み。

4. **次フェーズ推奨**: ブラウザ実機テスト（UIインタラクション、カードドラッグ＆ドロップ、ゲームクリア・失敗フロー確認）を実施することを推奨。
