/**
 * 初期データ投入スクリプト
 * 実行: npm run db:seed
 */
import { createClient } from '@libsql/client'
import { drizzle } from 'drizzle-orm/libsql'
import { categories, cards, stages, stageCards, playerProgress } from './schema'

const CATEGORIES = [
  { name: '柄',           cards: ['破線','水玉','ギンガム','ストライプ','アーガイル','ペイズリー','ヘリンボーン','タータン'] },        // index 0
  { name: '利益',         cards: ['収益','黒字','配当','純益','売上','増収','剰余','損失'] },                                          // index 1
  { name: 'フィット',     cards: ['スクワット','プランク','ランジ','バーピー','懸垂','ダッシュ','ヨガ','ジョグ'] },                    // index 2
  { name: '三拍子',       cards: ['ワルツ','ポルカ','メヌエット','マズルカ','サラバンド','ジーグ','シャコンヌ','ブーレ'] },            // index 3
  { name: '音楽',         cards: ['ピッコロ','オーボエ','ファゴット','チューバ','コルネット','リュート','チェンバロ','リコーダー'] },  // index 4
  { name: '日本の都市',   cards: ['東京','大阪','京都','名古屋','福岡','札幌','神戸','広島'] },                                        // index 5
  { name: '花',           cards: ['桜','梅','菊','薔薇','百合','蓮','向日葵'] },                                                      // index 6
  { name: '果物',         cards: ['りんご','みかん','ぶどう','桃','梨','いちご','バナナ'] },                                          // index 7
  { name: '野菜',         cards: ['にんじん','キャベツ','玉ねぎ','じゃがいも','きゅうり','なす'] },                                  // index 8
  { name: '魚介類',       cards: ['マグロ','タイ','サバ','イカ','エビ','タコ','ウニ'] },                                              // index 9
  { name: '哺乳類',       cards: ['ライオン','象','キリン','熊','虎','狼'] },                                                         // index 10
  { name: '鳥',           cards: ['鷹','ペンギン','フラミンゴ','鶴','燕','スズメ'] },                                                // index 11
  { name: '昆虫',         cards: ['蝶','カブトムシ','トンボ','ホタル','ミツバチ','クワガタ'] },                                      // index 12
  { name: '惑星',         cards: ['水星','金星','火星','木星','土星','天王星','海王星'] },                                            // index 13
  { name: '天気',         cards: ['晴れ','雨','雪','曇り','霧','雷'] },                                                               // index 14
  { name: '弦楽器',       cards: ['バイオリン','チェロ','ビオラ','コントラバス','ハープ','ギター'] },                                // index 15
  { name: '管楽器',       cards: ['フルート','クラリネット','トランペット','トロンボーン','ホルン','チューバ'] },                    // index 16
  { name: '打楽器',       cards: ['ドラム','ティンパニ','シンバル','マリンバ','カスタネット'] },                                     // index 17
  { name: '球技',         cards: ['サッカー','野球','バスケ','テニス','バレー','ラグビー'] },                                        // index 18
  { name: '格闘技',       cards: ['柔道','空手','剣道','相撲','合気道'] },                                                           // index 19
  { name: '水泳',         cards: ['クロール','背泳ぎ','平泳ぎ','バタフライ','個人メドレー'] },                                       // index 20
  { name: '職業',         cards: ['医師','弁護士','教師','料理人','消防士','警察官'] },                                              // index 21
  { name: '乗り物',       cards: ['電車','バス','飛行機','船','自転車','バイク','ヘリ'] },                                           // index 22
  { name: '調理法',       cards: ['焼く','煮る','蒸す','揚げる','炒める','茹でる'] },                                               // index 23
  { name: '調味料',       cards: ['醤油','味噌','砂糖','塩','酢','みりん'] },                                                        // index 24
  { name: '和食',         cards: ['寿司','天ぷら','そば','うどん','刺身','味噌汁'] },                                               // index 25
  { name: 'スイーツ',     cards: ['ケーキ','プリン','アイス','クッキー','チョコ','シュークリーム'] },                               // index 26
  { name: '飲み物',       cards: ['緑茶','コーヒー','紅茶','ジュース','牛乳','ビール'] },                                           // index 27
  { name: '文房具',       cards: ['鉛筆','ボールペン','消しゴム','定規','ノート','はさみ'] },                                       // index 28
  { name: '家具',         cards: ['テーブル','椅子','ベッド','棚','ソファ','デスク'] },                                             // index 29
  { name: '家電',         cards: ['冷蔵庫','洗濯機','電子レンジ','テレビ','エアコン','掃除機'] },                                   // index 30
  { name: 'ファッション', cards: ['シャツ','パンツ','スカート','コート','ジャケット'] },                                            // index 31
  { name: '宝石',         cards: ['ダイヤ','ルビー','サファイア','エメラルド','アメジスト','パール'] },                             // index 32
  { name: '星座',         cards: ['牡羊座','牡牛座','双子座','蟹座','獅子座','乙女座','天秤座','蠍座'] },                           // index 33
  { name: '元素',         cards: ['水素','炭素','酸素','鉄','金','銀'] },                                                           // index 34
  { name: '感情',         cards: ['喜び','悲しみ','怒り','恐れ','驚き','嫌悪'] },                                                   // index 35
  { name: '色',           cards: ['赤','青','黄','緑','紫','橙','白','黒'] },                                                        // index 36
  { name: '方角',         cards: ['東','西','南','北'] },                                                                            // index 37
  { name: '時間帯',       cards: ['朝','昼','夕方','夜','深夜'] },                                                                   // index 38
  { name: '和楽器',       cards: ['琴','三味線','尺八','太鼓','琵琶'] },                                                            // index 39
  { name: 'ダンス',       cards: ['バレエ','フラメンコ','タンゴ','フラダンス','盆踊り'] },                                          // index 40
  { name: 'プログラミング', cards: ['Python','JavaScript','Java','Ruby','Swift','Go'] },                                             // index 41
  { name: '山岳',         cards: ['富士山','エベレスト','アルプス','キリマンジャロ','ヒマラヤ'] },                                  // index 42
  { name: '海洋',         cards: ['太平洋','大西洋','インド洋','北極海','地中海'] },                                                // index 43
  { name: '言語',         cards: ['日本語','英語','中国語','スペイン語','フランス語','ドイツ語'] },                                 // index 44
  { name: '国',           cards: ['日本','アメリカ','フランス','イギリス','ドイツ','中国','イタリア'] },                            // index 45
  { name: '通貨',         cards: ['円','ドル','ユーロ','ポンド','人民元'] },                                                        // index 46
  { name: '文学',         cards: ['小説','詩','随筆','戯曲','童話'] },                                                              // index 47
  { name: '美術技法',     cards: ['油絵','水彩','版画','彫刻','デッサン'] },                                                        // index 48
  { name: '建築様式',     cards: ['バロック','ゴシック','モダン','和風'] },                                                         // index 49
  { name: '診療科',       cards: ['内科','外科','眼科','耳鼻科','皮膚科','歯科'] },                                                 // index 50
  { name: '季節行事',     cards: ['正月','節分','ひな祭り','七夕','お盆','クリスマス'] },                                           // index 51
  { name: '日本料理',     cards: ['すき焼き','しゃぶしゃぶ','焼き鳥','お好み焼き','たこ焼き'] },                                   // index 52
  { name: 'パスタ',       cards: ['カルボナーラ','ペペロンチーノ','ボロネーゼ','アラビアータ','ジェノベーゼ'] },                   // index 53
  { name: 'ワイン産地',   cards: ['ボルドー','ブルゴーニュ','シャンパーニュ','トスカーナ'] },                                      // index 54
]

const STAGES = [
  // ── 入門 (5カテゴリ) ──
  { name: 'ステージ1  - 基礎の5カテゴリ',   categoryIndices: [0,1,2,3,4] },       // 柄・利益・フィット・三拍子・音楽
  { name: 'ステージ2  - 自然と都市',         categoryIndices: [5,6,7,8,9] },       // 日本の都市・花・果物・野菜・魚介類
  { name: 'ステージ3  - 生き物と自然',       categoryIndices: [10,11,12,13,14] },  // 哺乳類・鳥・昆虫・惑星・天気
  { name: 'ステージ4  - 音楽と格技',         categoryIndices: [15,16,17,18,19] },  // 弦楽器・管楽器・打楽器・球技・格闘技
  { name: 'ステージ5  - 生活入門',           categoryIndices: [20,21,22,23,24] },  // 水泳・職業・乗り物・調理法・調味料
  // ── 中級前半 (6カテゴリ) ──
  { name: 'ステージ6  - 食と生活用品',       categoryIndices: [25,26,27,28,29,30] },         // 和食・スイーツ・飲み物・文房具・家具・家電
  { name: 'ステージ7  - 美と宇宙',           categoryIndices: [31,32,33,34,35,36] },         // ファッション・宝石・星座・元素・感情・色
  { name: 'ステージ8  - 知識と芸術',         categoryIndices: [37,38,39,40,41,42] },         // 方角・時間帯・和楽器・ダンス・プログラミング・山岳
  { name: 'ステージ9  - 世界と表現',         categoryIndices: [43,44,45,46,47,48] },         // 海洋・言語・国・通貨・文学・美術技法
  { name: 'ステージ10 - 文化と食',           categoryIndices: [49,50,51,52,53,54] },         // 建築様式・診療科・季節行事・日本料理・パスタ・ワイン産地
  // ── 中級後半 (7カテゴリ) ──
  { name: 'ステージ11 - 色と世界',           categoryIndices: [0,7,10,18,24,36,44] },        // 柄・果物・哺乳類・球技・調味料・色・言語
  { name: 'ステージ12 - 自然と感情',         categoryIndices: [4,6,9,14,21,35,45] },         // 音楽・花・魚介類・天気・職業・感情・国
  { name: 'ステージ13 - 都市と宇宙',         categoryIndices: [5,8,11,13,16,22,33] },        // 日本の都市・野菜・鳥・惑星・管楽器・乗り物・星座
  { name: 'ステージ14 - 武道と文化',         categoryIndices: [1,12,15,19,25,29,47] },       // 利益・昆虫・弦楽器・格闘技・和食・家具・文学
  { name: 'ステージ15 - 体と食',             categoryIndices: [2,10,17,20,23,26,45] },       // フィット・哺乳類・打楽器・水泳・調理法・スイーツ・国
  // ── 上級前半 (8カテゴリ) ──
  { name: 'ステージ16 - リズムと海',         categoryIndices: [3,9,15,18,27,28,32,43] },     // 三拍子・魚介類・弦楽器・球技・飲み物・文房具・宝石・海洋
  { name: 'ステージ17 - 音楽と大地',         categoryIndices: [4,5,11,14,20,25,34,45] },     // 音楽・日本の都市・鳥・天気・水泳・和食・元素・国
  { name: 'ステージ18 - 花と生活',           categoryIndices: [6,8,12,17,21,30,40,51] },     // 花・野菜・昆虫・打楽器・職業・家電・ダンス・季節行事
  { name: 'ステージ19 - 自然と格技2',        categoryIndices: [7,10,13,16,19,22,29,42] },    // 果物・哺乳類・惑星・管楽器・格闘技・乗り物・家具・山岳
  { name: 'ステージ20 - 柄と世界',           categoryIndices: [0,9,15,18,24,27,35,46] },     // 柄・魚介類・弦楽器・球技・調味料・飲み物・感情・通貨
  // ── 上級後半 (9カテゴリ) ──
  { name: 'ステージ21 - 花と星空',           categoryIndices: [1,6,11,14,25,28,33,40,45] },  // 利益・花・鳥・天気・和食・文房具・星座・ダンス・国
  { name: 'ステージ22 - 体と芸術',           categoryIndices: [2,10,12,17,21,26,36,42,47] }, // フィット・哺乳類・昆虫・打楽器・職業・スイーツ・色・山岳・文学
  { name: 'ステージ23 - リズムと世界',       categoryIndices: [3,8,13,16,19,22,30,44,52] },  // 三拍子・野菜・惑星・管楽器・格闘技・乗り物・家電・言語・日本料理
  { name: 'ステージ24 - 都市と音楽2',        categoryIndices: [4,5,15,20,23,29,32,34,46] },  // 音楽・日本の都市・弦楽器・水泳・調理法・家具・宝石・元素・通貨
  { name: 'ステージ25 - 自然の饗宴',         categoryIndices: [6,7,10,11,18,24,27,39,53] },  // 花・果物・哺乳類・鳥・球技・調味料・飲み物・和楽器・パスタ
  // ── 超上級 (10カテゴリ) ──
  { name: 'ステージ26 - 色と知識',           categoryIndices: [0,8,12,14,17,21,28,36,41,50] },    // 柄・野菜・昆虫・天気・打楽器・職業・文房具・色・プログラミング・診療科
  { name: 'ステージ27 - 宇宙と感情',         categoryIndices: [1,9,13,16,19,26,30,32,35,44] },    // 利益・魚介類・惑星・管楽器・格闘技・スイーツ・家電・宝石・感情・言語
  { name: 'ステージ28 - 踊りと海',           categoryIndices: [2,11,15,20,25,29,33,40,43,45] },   // フィット・鳥・弦楽器・水泳・和食・家具・星座・ダンス・海洋・国
  { name: 'ステージ29 - リズムと自然',       categoryIndices: [3,6,10,12,18,22,27,34,42,51] },    // 三拍子・花・哺乳類・昆虫・球技・乗り物・飲み物・元素・山岳・季節行事
  { name: 'ステージ30 - 音楽と世界の終幕',   categoryIndices: [4,5,9,14,16,21,32,36,46,54] },     // 音楽・日本の都市・魚介類・天気・管楽器・職業・宝石・色・通貨・ワイン産地
]

async function seed() {
  const client = createClient({
    url: process.env.TURSO_DATABASE_URL!,
    authToken: process.env.TURSO_AUTH_TOKEN,
  })
  const db = drizzle(client)

  console.log('Clearing existing data...')
  await db.delete(playerProgress)
  await db.delete(stageCards)
  await db.delete(stages)
  await db.delete(cards)
  await db.delete(categories)

  // SQLiteのautoincrement連番をリセット
  await client.execute(`DELETE FROM sqlite_sequence WHERE name IN ('categories','cards','stages')`)

  // 1. カテゴリ挿入（55件）
  console.log('Inserting 55 categories...')
  await db.insert(categories).values(CATEGORIES.map(c => ({ name: c.name })))

  // 2. カテゴリカード挿入（各カテゴリ1枚、categoryId=null、textはカテゴリ名、ID=1〜55）
  console.log('Inserting category cards...')
  await db.insert(cards).values(
    CATEGORIES.map(c => ({ categoryId: null, text: c.name, type: 'category' as const }))
  )

  // 3. 通常カード挿入（各カテゴリのcards配列、ID=56〜）
  console.log('Inserting normal cards...')
  for (let i = 0; i < CATEGORIES.length; i++) {
    const catId = i + 1
    await db.insert(cards).values(
      CATEGORIES[i].cards.map(text => ({ categoryId: catId, text, type: 'normal' as const }))
    )
  }

  // 4. カードIDのオフセット計算
  // カテゴリカード: ID 1〜55（catIndex + 1 = categoryCardId）
  // 通常カード開始ID: 56 + catIndex前の通常カード枚数合計
  const normalCardOffsets: number[] = []
  let offset = 55 + 1 // 55枚のカテゴリカードの次から
  for (let i = 0; i < CATEGORIES.length; i++) {
    normalCardOffsets[i] = offset
    offset += CATEGORIES[i].cards.length
  }

  // 5. ステージ挿入（30件）
  console.log('Inserting 30 stages...')
  for (const stage of STAGES) {
    const normalCardCount = stage.categoryIndices.reduce(
      (sum, ci) => sum + CATEGORIES[ci].cards.length,
      0
    )
    const totalMoves = Math.max(40, Math.ceil(normalCardCount * 1.6 / 5) * 5)
    const [insertedStage] = await db
      .insert(stages)
      .values({ name: stage.name, totalMoves })
      .returning()

    // 6. stage_cards挿入
    const cardIds: number[] = []
    for (const ci of stage.categoryIndices) {
      // カテゴリカード（ID = ci + 1）
      cardIds.push(ci + 1)
      // 通常カード
      for (let j = 0; j < CATEGORIES[ci].cards.length; j++) {
        cardIds.push(normalCardOffsets[ci] + j)
      }
    }
    await db.insert(stageCards).values(
      cardIds.map(cardId => ({ stageId: insertedStage.id, cardId }))
    )
  }

  console.log('Seed completed!')
  process.exit(0)
}

seed().catch(err => {
  console.error(err)
  process.exit(1)
})
