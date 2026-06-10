/**
 * v0.8 限定蛋壳
 * - 4 款蛋壳：钻石 💎 / 星辰 ⭐ / 樱花 🌸 / 暗夜 🌑
 * - 每次扭蛋有 5% 概率出限定蛋（出后 100% 必出 Lv.3+ 棋子）
 * - 神赐事件：8% 概率直接给 Lv.6 棋子
 */
import { rng, pick } from './rng'

export type SpecialEggId = 'diamond' | 'star' | 'sakura' | 'night' | null

export interface SpecialEgg {
  id: Exclude<SpecialEggId, null>
  emoji: string
  label: string
  /** 蛋壳颜色（多色渐变） */
  shellColors: [string, string, string]
  /** 出蛋后棋子最低等级 */
  minLevel: 3 | 4 | 5
  /** 触发的额外金币奖励 */
  bonusCoins: number
  rarity: 'epic' | 'legend'
}

export const SPECIAL_EGGS: SpecialEgg[] = [
  { id: 'diamond', emoji: '💎', label: '钻石蛋', shellColors: ['#a5f3fc', '#67e8f9', '#22d3ee'], minLevel: 4, bonusCoins: 20,  rarity: 'epic' },
  { id: 'star',    emoji: '⭐', label: '星辰蛋', shellColors: ['#fef3c7', '#fde68a', '#fcd34d'], minLevel: 3, bonusCoins: 15,  rarity: 'epic' },
  { id: 'sakura',  emoji: '🌸', label: '樱花蛋', shellColors: ['#fce7f3', '#fbcfe8', '#f9a8d4'], minLevel: 3, bonusCoins: 15,  rarity: 'epic' },
  { id: 'night',   emoji: '🌑', label: '暗夜蛋', shellColors: ['#312e81', '#1e1b4b', '#0c0a1e'], minLevel: 5, bonusCoins: 50,  rarity: 'legend' },
]

const WEIGHTED: Array<{ id: SpecialEgg['id']; w: number }> = [
  { id: 'diamond', w: 4 },
  { id: 'star',    w: 6 },
  { id: 'sakura',  w: 6 },
  { id: 'night',   w: 2 },
]

/** 5% 概率出限定蛋 */
export const rollSpecialEgg = (): SpecialEgg | null => {
  if (rng() >= 0.05) return null
  const total = WEIGHTED.reduce((s, it) => s + it.w, 0)
  let r = rng() * total
  for (const it of WEIGHTED) {
    r -= it.w
    if (r <= 0) return SPECIAL_EGGS.find(e => e.id === it.id)!
  }
  return SPECIAL_EGGS[0]!
}

export const getSpecialEggById = (id: SpecialEgg['id']): SpecialEgg | undefined =>
  SPECIAL_EGGS.find(e => e.id === id)

/** 神赐事件：8% 概率直接送 Lv.6 棋子（独立于限定蛋） */
export const ROLL_DIVINE_BLESSING = 0.08
export const DIVINE_MIN_LEVEL = 6
