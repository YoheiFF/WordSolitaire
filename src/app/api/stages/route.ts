export const dynamic = 'force-dynamic'

import { db } from '@/lib/db/client'
import { stages, stageCards, cards, categories } from '@/lib/db/schema'
import { eq, inArray } from 'drizzle-orm'
import type { StageData, CardData, CategoryData } from '@/types/game'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      // ステージ一覧取得
      const result = await db
        .select({
          id: stages.id,
          name: stages.name,
          totalMoves: stages.totalMoves,
        })
        .from(stages)

      return Response.json(result)
    }

    // ステージ詳細取得
    const stageId = parseInt(id)
    if (isNaN(stageId)) {
      return Response.json({ error: 'Invalid stage id' }, { status: 400 })
    }

    // ステージ本体を取得
    const stageRows = await db
      .select()
      .from(stages)
      .where(eq(stages.id, stageId))

    if (stageRows.length === 0) {
      return Response.json({ error: 'Stage not found' }, { status: 404 })
    }

    const stage = stageRows[0]

    // このステージのcard_idを取得
    const stageCardRows = await db
      .select({ cardId: stageCards.cardId })
      .from(stageCards)
      .where(eq(stageCards.stageId, stageId))

    const cardIds = stageCardRows.map((r) => r.cardId)

    if (cardIds.length === 0) {
      const response: StageData = {
        id: stage.id,
        name: stage.name,
        totalMoves: stage.totalMoves,
        cards: [],
        categories: [],
      }
      return Response.json(response)
    }

    // カードを取得
    const cardRows = await db
      .select()
      .from(cards)
      .where(inArray(cards.id, cardIds))

    // カテゴリIDを収集（NULL除外）
    const categoryIds = [
      ...new Set(
        cardRows
          .map((c) => c.categoryId)
          .filter((id): id is number => id !== null)
      ),
    ]

    // カテゴリを取得
    let categoryRows: { id: number; name: string; createdAt: string | null }[] = []
    if (categoryIds.length > 0) {
      categoryRows = await db
        .select()
        .from(categories)
        .where(inArray(categories.id, categoryIds))
    }

    const cardData: CardData[] = cardRows.map((c) => ({
      id: c.id,
      categoryId: c.categoryId,
      text: c.text,
      type: c.type as 'normal' | 'category',
    }))

    const categoryData: CategoryData[] = categoryRows.map((c) => ({
      id: c.id,
      name: c.name,
    }))

    const response: StageData = {
      id: stage.id,
      name: stage.name,
      totalMoves: stage.totalMoves,
      cards: cardData,
      categories: categoryData,
    }

    return Response.json(response)
  } catch (error) {
    console.error('GET /api/stages error:', error)
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
