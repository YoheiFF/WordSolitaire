export const dynamic = 'force-dynamic'

import { db } from '@/lib/db/client'
import { playerProgress } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { sql } from 'drizzle-orm'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const playerId = searchParams.get('playerId')

    if (!playerId) {
      return Response.json({ error: 'playerId is required' }, { status: 400 })
    }

    const rows = await db
      .select()
      .from(playerProgress)
      .where(eq(playerProgress.playerId, playerId))

    const result = rows.map((r) => ({
      stageId: r.stageId,
      cleared: r.cleared === 1,
      bestMovesRemaining: r.bestMovesRemaining,
      playCount: r.playCount,
    }))

    return Response.json(result)
  } catch (error) {
    console.error('GET /api/progress error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()

    // バリデーション
    if (
      typeof body.playerId !== 'string' ||
      typeof body.stageId !== 'number' ||
      typeof body.cleared !== 'boolean' ||
      typeof body.movesRemaining !== 'number'
    ) {
      return Response.json({ error: 'Invalid request body' }, { status: 400 })
    }

    const { playerId, stageId, cleared, movesRemaining } = body

    // UPSERT: 既存があれば更新、なければ挿入
    await db
      .insert(playerProgress)
      .values({
        playerId,
        stageId,
        cleared: cleared ? 1 : 0,
        bestMovesRemaining: movesRemaining,
        playCount: 1,
        updatedAt: new Date().toISOString(),
      })
      .onConflictDoUpdate({
        target: [playerProgress.playerId, playerProgress.stageId],
        set: {
          cleared: sql`CASE WHEN ${cleared ? 1 : 0} > cleared THEN ${cleared ? 1 : 0} ELSE cleared END`,
          bestMovesRemaining: sql`CASE WHEN excluded.best_moves_remaining > best_moves_remaining THEN excluded.best_moves_remaining ELSE best_moves_remaining END`,
          playCount: sql`play_count + 1`,
          updatedAt: new Date().toISOString(),
        },
      })

    return Response.json({ success: true })
  } catch (error) {
    console.error('POST /api/progress error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
