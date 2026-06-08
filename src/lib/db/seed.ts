/**
 * 初期データ投入スクリプト
 * 実行: npm run db:seed
 */
import { createClient } from '@libsql/client'
import { drizzle } from 'drizzle-orm/libsql'
import { categories, cards, stages, stageCards } from './schema'

async function seed() {
  const client = createClient({
    url: process.env.TURSO_DATABASE_URL!,
    authToken: process.env.TURSO_AUTH_TOKEN,
  })
  const db = drizzle(client)

  console.log('Seeding database...')

  // カテゴリ（5件）
  console.log('Inserting categories...')
  await db.insert(categories).values([
    { name: '柄' },       // id=1
    { name: '利益' },     // id=2
    { name: 'フィット' }, // id=3
    { name: '三拍子' },   // id=4
    { name: '音楽' },     // id=5
  ])

  // カテゴリカード（各カテゴリ1枚、category_id=NULL）
  console.log('Inserting category cards...')
  await db.insert(cards).values([
    { categoryId: null, text: '柄',       type: 'category' },  // id=1
    { categoryId: null, text: '利益',     type: 'category' },  // id=2
    { categoryId: null, text: 'フィット', type: 'category' },  // id=3
    { categoryId: null, text: '三拍子',   type: 'category' },  // id=4
    { categoryId: null, text: '音楽',     type: 'category' },  // id=5
  ])

  // 通常カード（各カテゴリ8枚 = 計40枚）
  console.log('Inserting normal cards...')

  // 柄カテゴリ（category_id=1）
  await db.insert(cards).values([
    { categoryId: 1, text: '破線',       type: 'normal' },  // id=6
    { categoryId: 1, text: '水玉',       type: 'normal' },  // id=7
    { categoryId: 1, text: 'ギンガム',   type: 'normal' },  // id=8
    { categoryId: 1, text: 'ストライプ', type: 'normal' },  // id=9
    { categoryId: 1, text: 'アーガイル', type: 'normal' },  // id=10
    { categoryId: 1, text: 'ペイズリー', type: 'normal' },  // id=11
    { categoryId: 1, text: 'ヘリンボーン', type: 'normal' }, // id=12
    { categoryId: 1, text: 'タータン',   type: 'normal' },  // id=13
  ])

  // 利益カテゴリ（category_id=2）
  await db.insert(cards).values([
    { categoryId: 2, text: '利益', type: 'normal' },  // id=14
    { categoryId: 2, text: '収益', type: 'normal' },  // id=15
    { categoryId: 2, text: '黒字', type: 'normal' },  // id=16
    { categoryId: 2, text: '配当', type: 'normal' },  // id=17
    { categoryId: 2, text: '純益', type: 'normal' },  // id=18
    { categoryId: 2, text: '売上', type: 'normal' },  // id=19
    { categoryId: 2, text: '増収', type: 'normal' },  // id=20
    { categoryId: 2, text: '剰余', type: 'normal' },  // id=21
  ])

  // フィットカテゴリ（category_id=3）
  await db.insert(cards).values([
    { categoryId: 3, text: 'ジョグ',     type: 'normal' },  // id=22
    { categoryId: 3, text: 'スクワット', type: 'normal' },  // id=23
    { categoryId: 3, text: 'プランク',   type: 'normal' },  // id=24
    { categoryId: 3, text: 'ランジ',     type: 'normal' },  // id=25
    { categoryId: 3, text: 'バーピー',   type: 'normal' },  // id=26
    { categoryId: 3, text: '懸垂',       type: 'normal' },  // id=27
    { categoryId: 3, text: 'ダッシュ',   type: 'normal' },  // id=28
    { categoryId: 3, text: 'ヨガ',       type: 'normal' },  // id=29
  ])

  // 三拍子カテゴリ（category_id=4）
  await db.insert(cards).values([
    { categoryId: 4, text: 'ワルツ',     type: 'normal' },  // id=30
    { categoryId: 4, text: 'ポルカ',     type: 'normal' },  // id=31
    { categoryId: 4, text: 'メヌエット', type: 'normal' },  // id=32
    { categoryId: 4, text: 'マズルカ',   type: 'normal' },  // id=33
    { categoryId: 4, text: 'サラバンド', type: 'normal' },  // id=34
    { categoryId: 4, text: 'ジーグ',     type: 'normal' },  // id=35
    { categoryId: 4, text: 'シャコンヌ', type: 'normal' },  // id=36
    { categoryId: 4, text: 'ブーレ',     type: 'normal' },  // id=37
  ])

  // 音楽カテゴリ（category_id=5）
  await db.insert(cards).values([
    { categoryId: 5, text: 'フルート',     type: 'normal' },  // id=38
    { categoryId: 5, text: 'バイオリン',   type: 'normal' },  // id=39
    { categoryId: 5, text: 'チェロ',       type: 'normal' },  // id=40
    { categoryId: 5, text: 'ハープ',       type: 'normal' },  // id=41
    { categoryId: 5, text: 'オーボエ',     type: 'normal' },  // id=42
    { categoryId: 5, text: 'クラリネット', type: 'normal' },  // id=43
    { categoryId: 5, text: 'ピッコロ',     type: 'normal' },  // id=44
    { categoryId: 5, text: 'トランペット', type: 'normal' },  // id=45
  ])

  // ステージ1定義
  console.log('Inserting stage...')
  await db.insert(stages).values([
    { name: 'ステージ1 - 音楽と模様の世界', totalMoves: 50 },  // id=1
  ])

  // ステージ1のカード（柄・利益・フィット・三拍子の4カテゴリ: カテゴリカード4枚 + 通常カード32枚 = 計36枚）
  console.log('Inserting stage_cards...')
  await db.insert(stageCards).values([
    // カテゴリカード（id=1〜4: 柄・利益・フィット・三拍子）
    { stageId: 1, cardId: 1 },
    { stageId: 1, cardId: 2 },
    { stageId: 1, cardId: 3 },
    { stageId: 1, cardId: 4 },
    // 柄カード（id=6〜13）
    { stageId: 1, cardId: 6 },
    { stageId: 1, cardId: 7 },
    { stageId: 1, cardId: 8 },
    { stageId: 1, cardId: 9 },
    { stageId: 1, cardId: 10 },
    { stageId: 1, cardId: 11 },
    { stageId: 1, cardId: 12 },
    { stageId: 1, cardId: 13 },
    // 利益カード（id=14〜21）
    { stageId: 1, cardId: 14 },
    { stageId: 1, cardId: 15 },
    { stageId: 1, cardId: 16 },
    { stageId: 1, cardId: 17 },
    { stageId: 1, cardId: 18 },
    { stageId: 1, cardId: 19 },
    { stageId: 1, cardId: 20 },
    { stageId: 1, cardId: 21 },
    // フィットカード（id=22〜29）
    { stageId: 1, cardId: 22 },
    { stageId: 1, cardId: 23 },
    { stageId: 1, cardId: 24 },
    { stageId: 1, cardId: 25 },
    { stageId: 1, cardId: 26 },
    { stageId: 1, cardId: 27 },
    { stageId: 1, cardId: 28 },
    { stageId: 1, cardId: 29 },
    // 三拍子カード（id=30〜37）
    { stageId: 1, cardId: 30 },
    { stageId: 1, cardId: 31 },
    { stageId: 1, cardId: 32 },
    { stageId: 1, cardId: 33 },
    { stageId: 1, cardId: 34 },
    { stageId: 1, cardId: 35 },
    { stageId: 1, cardId: 36 },
    { stageId: 1, cardId: 37 },
  ])

  console.log('Seed completed successfully!')
  process.exit(0)
}

seed().catch((err) => {
  console.error('Seed failed:', err)
  process.exit(1)
})
