import type { StageData, StageListItem, SaveProgressPayload } from '@/types/game'

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? ''

/** ステージ一覧を取得 */
export async function fetchStageList(): Promise<StageListItem[]> {
  const res = await fetch(`${API_BASE}/api/stages`)
  if (!res.ok) throw new Error('Failed to fetch stage list')
  return res.json()
}

/** ステージ詳細（カード・カテゴリ含む）を取得 */
export async function fetchStageDetail(stageId: number): Promise<StageData> {
  const res = await fetch(`${API_BASE}/api/stages?id=${stageId}`)
  if (!res.ok) throw new Error(`Failed to fetch stage ${stageId}`)
  return res.json()
}

/** プレイヤー進捗を保存 */
export async function saveProgress(data: SaveProgressPayload): Promise<void> {
  const res = await fetch(`${API_BASE}/api/progress`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error('Failed to save progress')
}
