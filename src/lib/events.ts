/**
 * v0.7 随机事件系统
 * - 8 种事件：宠物撒娇 / 元素共鸣 / 时间倒流 / 双倍时段 / 连击风暴 / 扭蛋狂欢 / 守护之盾 / 神秘访客
 * - 每次 merge 后按概率触发
 * - 触发后弹全屏事件卡 → 自动给奖励 + 视觉反馈
 */
import { rng, pick } from './rng'

export type RandomEventId =
  | 'pet_cuddle'       // 宠物撒娇：下一次喂食 +100% 好感
  | 'element_resonance' // 元素共鸣：当前主题下一次合并 ×3
  | 'time_rewind'       // 时间倒流：清除网格所有 Lv.1-2 棋子并返回 3 币/个
  | 'double_hour'       // 双倍时段：60 秒内全事件 ×2
  | 'combo_storm'       // 连击风暴：30 秒内每次滑动强制连击
  | 'gacha_frenzy'      // 扭蛋狂欢：下一次扭蛋免费 + 必出 Lv.3+
  | 'guardian_shield'   // 守护之盾：30 秒内合并失败不断连击
  | 'mystery_visitor'   // 神秘访客：直接给 1 个随机区域 Lv.5 棋子入网

export interface RandomEvent {
  id: RandomEventId
  emoji: string
  title: string
  desc: string
  durationMs?: number   // 持续事件（0 = 即时）
  color: string
}

export const RANDOM_EVENTS: RandomEvent[] = [
  { id: 'pet_cuddle',         emoji: '💕', title: '宠物撒娇',     desc: '下一次喂食好感翻倍',     color: '#fb7185' },
  { id: 'element_resonance',  emoji: '✨', title: '元素共鸣',     desc: '当前主题下一次合并 ×3',  color: '#a78bfa' },
  { id: 'time_rewind',        emoji: '⏪', title: '时间倒流',     desc: '清除 Lv.1-2 棋子并返还 3 币/个', color: '#22d3ee' },
  { id: 'double_hour',        emoji: '⏰', title: '双倍时段',     desc: '60 秒内全事件 ×2',       durationMs: 60_000, color: '#fbbf24' },
  { id: 'combo_storm',        emoji: '⚡', title: '连击风暴',     desc: '30 秒内强制连击不中断',  durationMs: 30_000, color: '#f97316' },
  { id: 'gacha_frenzy',       emoji: '🎰', title: '扭蛋狂欢',     desc: '下次扭蛋免费 + 必出 Lv.3+', color: '#34d399' },
  { id: 'guardian_shield',    emoji: '🛡️', title: '守护之盾',     desc: '30 秒内滑动失败不断连击', durationMs: 30_000, color: '#60a5fa' },
  { id: 'mystery_visitor',    emoji: '👁️', title: '神秘访客',     desc: '送你 1 个随机区域 Lv.5 棋子', color: '#c084fc' },
]

/** 8 种事件权重（更"爽"的事件略高） */
const WEIGHTED: Array<{ id: RandomEventId; w: number }> = [
  { id: 'pet_cuddle',         w: 18 },
  { id: 'element_resonance',  w: 15 },
  { id: 'time_rewind',        w: 12 },
  { id: 'double_hour',        w: 10 },
  { id: 'combo_storm',        w: 10 },
  { id: 'gacha_frenzy',       w: 12 },
  { id: 'guardian_shield',    w: 13 },
  { id: 'mystery_visitor',    w: 10 },
]

export interface ActiveBuff {
  id: RandomEventId
  expiresAt: number
}

/** 每次合并后调用：返回 true 表示触发新事件 */
export const rollRandomEvent = (): RandomEvent | null => {
  // 8% 触发率（每次合并独立计算）
  if (rng() >= 0.08) return null
  return pickWeighted(WEIGHTED)
}

const pickWeighted = <T extends { id: RandomEventId; w: number }>(items: T[]): RandomEvent => {
  const total = items.reduce((s, it) => s + it.w, 0)
  let r = rng() * total
  for (const it of items) {
    r -= it.w
    if (r <= 0) return RANDOM_EVENTS.find(e => e.id === it.id)!
  }
  return RANDOM_EVENTS[RANDOM_EVENTS.length - 1]!
}

export const getEventById = (id: RandomEventId): RandomEvent | undefined =>
  RANDOM_EVENTS.find(e => e.id === id)
