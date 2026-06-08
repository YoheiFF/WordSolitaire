---
project_id: "2026-06-07-1200-word-solitaire"
phase: research
created: "2026-06-07"
---
# 情報収集レポート: ワードソリティアゲーム開発

## 結論サマリー

ワードソリティアは「カード上の文字を選んで単語を作り、ボードを全クリアする」ハイブリッドゲームジャンルで、複数のバリアントが存在する。最も参照価値が高い実装は **Wordscapes Solitaire（PeopleFun）** で、トライピークス型のカード配置 + 文字タップで単語を作成 + スコア制の3スター評価システムを採用している。技術面では **Next.js `output: 'export'` + Capacitor 8** の静的エクスポート方式が2025年時点のデファクトスタンダードであり、ただしSSR/APIルートは利用不可という制約がある。Turso（LibSQL）はVercel + Next.jsとの相性が良くサーバーレス環境で動作し、フリーティアが十分豊富。英単語辞書の実装には `wordlist-js` npm パッケージが最適候補。Google Play（$25一回払い）・App Store（$99/年）への提出フローは確立されているが、Google Playは新規個人アカウントで12名×14日のクローズドテストが必須という重大な制約がある。

---

## 確認済み事実

- [ファクト] Wordscapes Solitaire（PeopleFun）: App Store 4.7/5（2,200+評価）、Google Play 配信中。ボードのカード配置はレベルごとに異なり、タップしてレタートレイに積んで単語送信でクリア（出典: https://apps.apple.com/ph/app/wordscapes-solitaire/id6452119853）
- [ファクト] スコアリング: 各文字に点数（A/Tなど頻出文字=1点、J/Zなど希少文字=高点）。単語長ボーナス: 2文字=なし、3文字=2倍、4文字=3倍、5文字=4倍（以降+1倍ずつ増加）（出典: https://peoplefun.helpshift.com/hc/en/20-wordscapes-solitaire/faq/456-scoring/）
- [ファクト] 1レベルで最大3スター獲得可能（出典: https://peoplefun.helpshift.com/hc/en/20-wordscapes-solitaire/faq/458-stars/）
- [ファクト] ドローパイル: ボード上で単語が作れない時はハンド（ドローパイル）からカードを引ける。ハンドを使い切ってもボードが残ったらレベル失敗（出典: https://peoplefun.helpshift.com/hc/en/20-wordscapes-solitaire/section/99-the-basics/）
- [ファクト] ブースター種類: Randomizer（ボード文字全入替）、ハンマー（カード1枚除去）、Wild Card（任意文字）、Show Best Word（最高スコア単語をレタートレイに自動入力）（出典: https://www.wordcheats.com/wordscapes-solitaire-solver）
- [ファクト] 特殊カード: Locked Card（鍵が必要）、Enchanted Card（複数回タップで除去）、Wild Card（任意文字として使用可）（出典: https://www.wordcheats.com/wordscapes-solitaire-solver）
- [ファクト] Word Solitaire（kloonigames）: 5文字単語でボードクリア。全カードが最初から表向き（クラシックソリティアと異なる）。CTRL+Z でアンドゥ可能（出典: https://kloonigames.itch.io/wordsolitaire）
- [ファクト] Word Solitaire: Cards & Puzzle（Qiiwi Games）: App Store 4.6/5（108評価）。トライピークス型レイアウト＋ダブルレター・トリプルワードスロット有り（出典: https://apps.apple.com/us/app/word-solitaire-cards-puzzle/id1610517273）
- [ファクト] Word Solitaire-Unscramble Puz: App Store 4.9/5（7,900+評価）、Google Play配信中。サブスクリプション$4.99/週（出典: https://apps.apple.com/us/app/word-solitaire-unscramble-puz/id6741701173）
- [ファクト] Next.js + Capacitor 8: `output: 'export'` + `images: { unoptimized: true }` で静的エクスポート必須。SSR・APIルート不可（出典: https://capgo.app/blog/building-a-native-mobile-app-with-nextjs-and-capacitor/）
- [ファクト] Capacitorの必要パッケージ: `@capacitor/core`, `@capacitor/cli`, `@capacitor/ios`, `@capacitor/android`（出典: https://nextnative.dev/tutorials/convert-nextjs-to-mobile-app）
- [ファクト] Turso フリーティア: 5GB ストレージ、100データベース、月5億回行読み取り（出典: https://turso.tech/pricing）
- [ファクト] Turso + Next.js 推奨ORM: Drizzle ORM（`drizzle-orm @libsql/client`）。エッジ環境では `@libsql/client/web` を使用（出典: https://docs.turso.tech/sdk/ts/orm/drizzle）
- [ファクト] Google Play: 初期登録$25（一回払い）、AABフォーマット必須、API level 35以上ターゲット必須、2023年11月以降作成の個人アカウントは12名×14日クローズドテスト必須（出典: https://tms-outsource.com/blog/posts/how-to-publish-an-app-on-google-play/）
- [ファクト] App Store: Apple Developer Program $99/年、Xcode 16以上必須、iOS 18 SDK必須（2025年4月24日以降）（出典: https://developer.apple.com/programs/whats-included/）
- [ファクト] 英単語辞書npmパッケージ: `wordlist-js`（活発にメンテナンス中、ゲーム向けフィルタリング機能あり）（出典: https://github.com/jordanshatford/wordlist-js）

---

## 推測・未確認

- [推測] Wordscapes Solitaireのボード上のカードは「覆われた（下のカードが上のカードで覆われている）」構造で、上のカードが除去されて初めてアクセス可能になる可能性が高い（トライピークス型の特性から推測）（要検証）
- [推測] ワードソリティアの最も中毒性の高い要素は「ドローパイルの枚数残量による緊張感」と「長い単語を作ったときのスコアボーナス」の組み合わせと推測（要検証）
- [推測] Next.js + Capacitor構成でゲームロジックをクライアントサイドのみで完結させ、スコア・進捗のみをTurso APIに送信するアーキテクチャが最適と推測（APIルート代替はVercel上のNext.js APIルートをHTTPS経由で呼び出す方式）（要設計確認）
- [未確認] Wordscapes Solitaireの具体的なカード枚数・列数・段数の構成（スクリーンショットにアクセスできず）
- [未確認] Word Solitaire-Unscramble Puzzの具体的なゲームボードレイアウト（詳細ページ403エラー）
- [未確認] Turso embedded replicasがCapacitorネイティブアプリ内で直接使用可能かどうか

---

## ワードソリティア ゲームルール詳細

### ジャンル定義
ワードソリティアは「ソリティア型カードゲーム × 単語ゲーム」のハイブリッドジャンル。2020年代中盤に確立した比較的新しいジャンルで、クロンダイク/トライピークスのカード配置・除去メカニクスと、Wordle/Wordscapes等の単語パズルを融合させたもの。

### 代表的バリアント

#### バリアント1: Wordscapes Solitaire型（最も普及・推奨参考実装）
**ゲームフロー:**
1. ボードにレター（文字）カードが複数枚配置される（レベルごとに異なるレイアウト）
2. カードには重なりがあり、上のカードが取り除かれると下のカードが表向きになりアクセス可能になる
3. プレイヤーはアクセス可能なカードをタップ → レタートレイに追加される
4. レタートレイに有効な英単語が揃うと緑色のSubmitボタンが有効化される
5. Submitを押すと、その単語を形成するカードがボードから除去される
6. ボード上で単語が作れない場合、ドローパイルから1枚引く（ハンド）
7. ボードを全クリアしたらレベルクリア
8. ハンドを使い切ってもボードが残ったらレベル失敗、ライフ1失う

**必勝のコツ（戦略要素）:**
- 大きなスタック（下に多くのカードが重なっているカード）を優先して使う
- レタートレイの文字を部分的にキャンセルできる（タップで後続文字削除）
- Clearボタンでレタートレイ全クリアし、カードを元の位置に戻せる

#### バリアント2: kloonigames型（インディー実験的実装）
- 全カードが最初から表向き（覆いなし）
- 5文字ちょうどの単語のみ有効
- キーボード入力でA-Z + Enter送信
- CTRL+Z でアンドゥ可能
- 難易度が高く「ダークソウル of ソリティアワードゲーム」と評される

#### バリアント3: Word Association型（カテゴリ分類型）
- カードには単語や画像が書かれている
- 共通テーマのカードをファウンデーションパイルに積む
- 制限手数内に全カードを正しいカテゴリに分類するとクリア

### 共通の中毒性設計要素
- 短いセッション時間（3〜8分/1レベル）
- タイムプレッシャーなし（ストレスフリー）
- 「あと少しでクリアできそう」なテンション設計
- 長い単語を作ったときの達成感・ボーナス
- ワールドマップ型進行（世界の都市・ランドマークをアンロック）

---

## UI/UX 特徴

### Wordscapes Solitaire（参照モデル）
- **画面向き**: 縦持ち（ポートレート）
- **レイアウト構成（上から下）:**
  - 最上部: レベル番号・スター達成度・スコアメーター
  - 中央: カードボード（レタートレイの上方に配置）
  - ドローパイル（右端、または下部）
  - レタートレイ（中央下部）
  - Clear / Submit / Hint ボタン（最下部）
- **カードデザイン**: 角丸の白いカード、中央に大きな文字、下部に点数表示
- **覆われたカード**: 半透明または暗めの表示で区別
- **ボードのレイアウト形状**: レベルごとに多様（ピラミッド、格子、テーマ形状など）
- **アニメーション**: カードがレタートレイに飛んでいくアニメーション、単語消去時の消えるエフェクト
- **背景**: 世界各地のランドマーク風の美麗な背景画像（プログレッション演出）
- **特殊カード視覚的区別**: Lockedカードに錠前アイコン、Enchantedカードにハート表示

### 共通UI慣行
- ダブルレタースロット（文字スコア2倍）・トリプルワードスロットの視覚的強調
- コイン獲得アニメーション（マネタイズ演出）
- レベルクリア時の花火・紙吹雪エフェクト
- 進行度メーター（上部に残りカード数を視覚化）

---

## スコアリング・難易度システム

### スコアリング（Wordscapes Solitaire方式）
| 要素 | 詳細 |
|------|------|
| 文字ベーススコア | A, E, I, O, U, R, S, T, L, N = 1点; D, G = 2点; B, C, M, P = 3点; F, H, V, W, Y = 4点; K = 5点; J, X = 8点; Q, Z = 10点（スクラブル準拠推定）|
| 単語長ボーナス | 2文字=×1, 3文字=×2, 4文字=×3, 5文字=×4, n文字=×(n-1) |
| スター評価 | 各レベルで0〜3スター（獲得点数に基づく閾値） |
| ダブルレタースロット | 特定スロットを経由した文字スコア×2 |
| トリプルワードスロット | 単語全体のスコア×3 |

### 難易度システム
- 初期レベル: シンプルなボード形状、カード枚数少なめ、特殊カードなし
- 中級レベル: Lockedカード登場、ボード形状が複雑化
- 上級レベル: Enchantedカード登場、ドローパイルが少ない
- ライフ制（初期5ライフ）、レベル失敗で1消費
- ブースター（課金/広告視聴で獲得）で補助

---

## 既存コードベースの状況

`C:\project\WordSolitaire` ディレクトリには以下のファイルのみ存在:

```
.project/CLAUDE.md
.project/pm/CLAUDE.md
.project/pm/projects/_template.md
.project/design/CLAUDE.md
.project/engineering/CLAUDE.md
.project/qa/CLAUDE.md
.project/pm/requests/2026-06-07-1200-word-solitaire.md
.project/pm/projects/2026-06-07-1200-word-solitaire.md
```

**現状**: Next.js アプリケーションのソースコードは未存在。`.project/` 配下にプロジェクト管理ファイルのみが存在し、ゲーム実装はゼロベースで開始する必要がある。`package.json`、`src/`、`next.config.js` 等の実装ファイルは一切なし。

---

## 技術スタック調査結果

| 技術 | 用途 | 推奨ライブラリ/方法 | 参考 |
|-----|------|-------------------|------|
| Next.js 15+ | フロントエンド・Web基盤 | App Router + `output: 'export'` | https://nextjs.org |
| Capacitor 8 | Web→iOS/Android変換 | `@capacitor/core` `@capacitor/cli` `@capacitor/ios` `@capacitor/android` | https://capgo.app/blog/building-a-native-mobile-app-with-nextjs-and-capacitor/ |
| Turso（LibSQL） | エッジSQLiteデータベース | `@libsql/client` + Drizzle ORM | https://docs.turso.tech/sdk/ts/guides/nextjs |
| Drizzle ORM | DB操作・型安全 | `drizzle-orm @libsql/client drizzle-kit` | https://orm.drizzle.team/docs/tutorials/drizzle-with-turso |
| Vercel | ホスティング・APIサーバー | Next.js公式ホスティング | https://vercel.com/frameworks/nextjs |
| English Wordlist | 単語バリデーション | `wordlist-js`（ゲーム向けフィルタ付き）または `word-list` | https://github.com/jordanshatford/wordlist-js |
| Tailwind CSS | スタイリング | v4系 | - |
| Framer Motion | カードアニメーション | `framer-motion` | - |
| @capacitor-community/sqlite | モバイルローカルDB | オフラインゲーム状態保存用 | https://rxdb.info/capacitor-database.html |

---

## モバイル化戦略

### 推奨アーキテクチャ: ハイブリッド方式
```
[Next.js App]
    ├── Web版: Vercel にデプロイ（SSR + APIルート利用可能）
    │         └── Turso接続: APIルート経由でスコア保存
    │
    └── モバイル版: Next.js static export → Capacitor → iOS/Android
              └── Turso接続: HTTPSでVercel APIルートを呼び出す
                             （Capacitorからネットワーク越しにAPIアクセス）
```

### 手順
1. `next.config.js` に `output: 'export'` を追加
2. ゲームロジックを全てクライアントサイドで完結させる
3. スコア・進捗保存はVercel上のNext.js APIルートにHTTPSリクエスト
4. `npm run build` → `out/` ディレクトリ生成
5. `npx cap sync` でiOS/Androidプロジェクトに反映
6. Xcode (iOS) / Android Studio (Android) でビルド・署名
7. App Store Connect / Google Play Console にアップロード

### 制約事項
- **静的エクスポート必須**: SSR、Server Components with data fetching、Image Optimizationが使えない
- **iOS開発にはmacOSが必須**: Windows環境（本プロジェクト）ではiOSビルドは別途Mac環境が必要
- **Google Playの新規テスト要件**: 個人アカウントで12名×14日のクローズドテスト必須

---

## 採用候補と比較

| 候補 | メリット | デメリット | 推奨度 |
|------|---------|----------|--------|
| Next.js + Capacitor 8 | 単一コードベース、Webでも動く、活発なエコシステム | 静的エクスポート制約あり、SSR不可 | ★★★★★ |
| Expo (React Native) | モバイルネイティブ性能高い、OTA更新可能 | Web版の品質が落ちる、学習コスト高 | ★★★☆☆ |
| PWA単体 | 追加ビルド不要、シンプル | App Storeへの掲載が困難（Appleの制限） | ★★☆☆☆ |
| React Native + Next.js分離 | 各プラットフォーム最適化可能 | コードベース2本管理コスト大 | ★★☆☆☆ |
| Turso（LibSQL） | SQLite互換、エッジ高速、フリーティア充実、Drizzle対応 | キャッシュ・レプリカ設定の学習コスト | ★★★★★ |
| Neon（Postgres） | Postgres互換、Vercel統合簡単 | SQLiteではない、Capacitorオフライン対応外 | ★★★☆☆ |
| `wordlist-js` | ゲーム向けフィルタ付き、型安全、定期更新 | バンドルサイズに注意必要 | ★★★★☆ |
| Word Game Dictionary API | 常に最新辞書、定義も取得可能 | 無料プランは100コール/日の上限あり | ★★☆☆☆ |

---

## 制約・前提・リスク

- [リスク] **Windows開発環境でiOSビルド不可**: iOSアプリのビルドにはmacOSとXcodeが必須。App Store向けにはmac環境（物理/クラウド）が別途必要。影響度: 高
- [リスク] **Google Play新規テスト要件**: 個人デベロッパーアカウントでは12名の実テスター×14日間のクローズドテストが必須。タイムラインに最低2週間以上の追加が必要。影響度: 高
- [リスク] **Capacitorの静的エクスポート制約**: 英単語バリデーションをサーバーサイドで行う場合、Capacitor版では外部APIへのHTTPSリクエストに依存することになる。オフライン時のバリデーションには辞書データをバンドルする必要がある。影響度: 中
- [リスク] **辞書バンドルサイズ**: 英単語リストをアプリにバンドルするとバンドルサイズが大きくなる（word-listは1.8MB+）。lazy loadまたは事前フィルタリングが必要。影響度: 中
- [リスク] **Apple Developer費用**: App Storeリリースには年$99のApple Developer Program加入が必要。継続的なコスト要因。影響度: 低〜中
- [前提] ゲームロジック（単語バリデーション含む）はクライアントサイドで完結させる設計にする
- [前提] TursoはVercel上のNext.js APIルートから接続（Capacitorアプリからは直接接続しない）
- [前提] 初期リリースはAndroid（Google Play）を優先し、iOS（App Store）は第二フェーズとする

---

## 設計者への申し送り

- **最優先参考実装**: Wordscapes Solitaire（PeopleFun）を主要な模倣対象とする。スコアリング（文字点数×単語長倍率）・3スター評価・ドローパイル制・ブースター機能を設計に取り込むこと
- **ゲームボードデータ構造**: 各レベルのカード配置を「どのカードが何のカードを覆っているか（覆い関係グラフ）」で表現する設計が必要。DAG（有向非巡回グラフ）で表現可能
- **英単語辞書**: `wordlist-js` npm パッケージを採用し、バンドルサイズ最適化のため頻出単語（size 70以下）をベース辞書としてビルド時に取り込む設計を推奨
- **アーキテクチャ分離**: ゲームロジックは完全クライアントサイド（Capacitor対応）、データ永続化のみVercel APIルート + Tursoに分離するレイヤー設計にすること
- **モバイルUI設計**: ポートレート固定（縦持ち）、タッチ操作優先（最小タップ領域44×44px）、カードサイズはモバイル画面で指で押しやすいサイズ（最低60×80px程度）を確保
- **進行管理**: ワールドマップ型UI（Wordscapes Solitaire参照）でレベル選択と進捗を視覚化。Tursoにユーザーの進捗（クリア済みレベル・スター数・ハイスコア）を保存する設計にすること
- **特殊カード**: 初期バージョンはWild Cardのみ実装し、Locked/Enchantedは後続フェーズで追加を推奨（MVP縮小）
- **Google Playテスト要件**: リリース計画立案時に12名×14日のクローズドテスト期間をスケジュールに含めること（開発完了後2週間以上必要）
- **macOS環境の確保**: iOS App Store向けビルドにはmacOS機器が必要。GitHub Actions + macOSランナーを使うCIパイプラインか、MacBook等の物理機器を事前に確保すること
