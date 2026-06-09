const COINS_KEY = 'word-solitaire-coins'

export function getCoins(): number {
  if (typeof window === 'undefined') return 0
  return parseInt(localStorage.getItem(COINS_KEY) ?? '0', 10)
}

export function addCoins(amount: number): number {
  const current = getCoins()
  const next = current + amount
  localStorage.setItem(COINS_KEY, String(next))
  return next
}

export function spendCoins(amount: number): boolean {
  const current = getCoins()
  if (current < amount) return false
  localStorage.setItem(COINS_KEY, String(current - amount))
  return true
}

/** クリア時の獲得コイン内訳を計算 */
export function calcClearCoins(stageId: number, movesLeft: number): {
  levelBonus: number
  movesBonus: number
  total: number
} {
  const levelBonus = stageId * 10
  const movesBonus = movesLeft + 10
  return { levelBonus, movesBonus, total: levelBonus + movesBonus }
}
