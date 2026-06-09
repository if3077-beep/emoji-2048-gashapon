/**
 * 成就系统 v0.5
 * - 6 大类（合成/收集/扭蛋/宠物/连击/觉醒），共 50+ 个
 * - 进度追踪 + 解锁奖励
 */
import type { ZoneId } from '@/data/emoji-trees'
import type { Pet } from './pet-gen'

export type AchievementCategory = 'merge' | 'collect' | 'gacha' | 'pet' | 'combo' | 'awaken'

export interface Achievement {
  id: string
  category: AchievementCategory
  title: string
  desc: string
  icon: string
  /** 目标值 */
  target: number
  /** 奖励（币） */
  reward: number
  /** 检查进度的回调 */
  check: (ctx: AchievementCtx) => number
}

export interface AchievementCtx {
  mergeCount: number
  totalPulls: number
  maxLevel: number
  bestCombo: number
  awakenCount: number
  zoneMax: Record<ZoneId, number>
  collection: Record<ZoneId, number[]>
  pet: Pet | null
  petAffection: number
  totalCheckins: number
  totalSessions: number
}

export const CATEGORY_LABELS: Record<AchievementCategory, { label: string; icon: string; color: string }> = {
  merge:    { label: '合成大师', icon: '🧬', color: '#86efac' },
  collect:  { label: '收集者',  icon: '📖', color: '#93c5fd' },
  gacha:    { label: '扭蛋达人', icon: '🎰', color: '#fb923c' },
  pet:      { label: '宠物伙伴', icon: '🐾', color: '#f9a8d4' },
  combo:    { label: '连击高手', icon: '🔥', color: '#fbbf24' },
  awaken:   { label: '觉醒者',  icon: '⚡', color: '#a78bfa' },
}

export const ACHIEVEMENTS: Achievement[] = [
  // 合成类
  { id: 'm_1', category: 'merge', title: '初出茅庐', desc: '合成 1 次', icon: '🌱', target: 1, reward: 5, check: c => c.mergeCount },
  { id: 'm_2', category: 'merge', title: '合成新手', desc: '合成 50 次', icon: '🔨', target: 50, reward: 30, check: c => c.mergeCount },
  { id: 'm_3', category: 'merge', title: '合成老手', desc: '合成 200 次', icon: '⚒️', target: 200, reward: 100, check: c => c.mergeCount },
  { id: 'm_4', category: 'merge', title: '合成大师', desc: '合成 1000 次', icon: '🏭', target: 1000, reward: 500, check: c => c.mergeCount },
  { id: 'm_5', category: 'merge', title: '神话制造机', desc: '合成到 Lv.10', icon: '🌟', target: 1, reward: 200, check: c => (c.maxLevel >= 10 ? 1 : 0) },
  { id: 'm_6', category: 'merge', title: '觉醒之门', desc: '合成到 Lv.12', icon: '🚪', target: 1, reward: 500, check: c => (c.maxLevel >= 12 ? 1 : 0) },
  { id: 'm_7', category: 'merge', title: '无限循环', desc: '合成到 Lv.15', icon: '♾️', target: 1, reward: 2000, check: c => (c.maxLevel >= 15 ? 1 : 0) },
  { id: 'm_8', category: 'merge', title: '登峰造极', desc: '合成到 Lv.20', icon: '👑', target: 1, reward: 10000, check: c => (c.maxLevel >= 20 ? 1 : 0) },

  // 收集类
  { id: 'c_1', category: 'collect', title: '图鉴开启', desc: '收集 5 个 emoji', icon: '📕', target: 5, reward: 10, check: c => totalCollected(c) },
  { id: 'c_2', category: 'collect', title: '半程之旅', desc: '收集 30 个 emoji', icon: '📗', target: 30, reward: 50, check: c => totalCollected(c) },
  { id: 'c_3', category: 'collect', title: '图鉴狂热', desc: '收集 100 个 emoji', icon: '📘', target: 100, reward: 200, check: c => totalCollected(c) },
  { id: 'c_4', category: 'collect', title: '一区通关', desc: '集齐 1 个主题的 11 个等级', icon: '🏆', target: 1, reward: 500, check: c => clearedZones(c) },
  { id: 'c_5', category: 'collect', title: '三区通关', desc: '集齐 3 个主题', icon: '🏆🏆', target: 3, reward: 1500, check: c => clearedZones(c) },
  { id: 'c_6', category: 'collect', title: '六区通关', desc: '集齐一半主题（6 个）', icon: '🎖️', target: 6, reward: 4000, check: c => clearedZones(c) },
  { id: 'c_7', category: 'collect', title: '全境化', desc: '集齐全部 12 个主题', icon: '🌍', target: 12, reward: 20000, check: c => clearedZones(c) },
  { id: 'c_8', category: 'collect', title: '觉醒收藏家', desc: '任意主题觉醒至 5 阶', icon: '🌠', target: 1, reward: 3000, check: c => (maxZoneMax(c) >= 16 ? 1 : 0) },

  // 扭蛋类
  { id: 'g_1', category: 'gacha', title: '一次抽卡', desc: '扭蛋 1 次', icon: '🎰', target: 1, reward: 0, check: c => c.totalPulls },
  { id: 'g_2', category: 'gacha', title: '扭蛋爱好者', desc: '扭蛋 10 次', icon: '🎲', target: 10, reward: 10, check: c => c.totalPulls },
  { id: 'g_3', category: 'gacha', title: '扭蛋狂人', desc: '扭蛋 100 次', icon: '🎯', target: 100, reward: 50, check: c => c.totalPulls },
  { id: 'g_4', category: 'gacha', title: '扭蛋大师', desc: '扭蛋 500 次', icon: '💰', target: 500, reward: 200, check: c => c.totalPulls },
  { id: 'g_5', category: 'gacha', title: '千次玄学', desc: '扭蛋 1000 次', icon: '🏧', target: 1000, reward: 500, check: c => c.totalPulls },

  // 宠物类
  { id: 'p_1', category: 'pet', title: '新生命', desc: '孵化出宠物', icon: '🥚', target: 1, reward: 100, check: c => (c.pet ? 1 : 0) },
  { id: 'p_2', category: 'pet', title: '初识之爱', desc: '宠物好感度 30', icon: '💕', target: 30, reward: 50, check: c => c.petAffection },
  { id: 'p_3', category: 'pet', title: '亲密伙伴', desc: '宠物好感度 60', icon: '💖', target: 60, reward: 150, check: c => c.petAffection },
  { id: 'p_4', category: 'pet', title: '形影不离', desc: '宠物好感度 100', icon: '💝', target: 100, reward: 500, check: c => c.petAffection },
  { id: 'p_5', category: 'pet', title: '破壳而出', desc: '宠物进化到幼崽', icon: '🐣', target: 1, reward: 100, check: c => (c.pet && c.pet.form !== 'egg' ? 1 : 0) },
  { id: 'p_6', category: 'pet', title: '成体之巅', desc: '宠物进化到成体', icon: '🦁', target: 1, reward: 500, check: c => (c.pet && (c.pet.form === 'adult' || c.pet.form === 'awakened') ? 1 : 0) },
  { id: 'p_7', category: 'pet', title: '觉醒之光', desc: '宠物觉醒', icon: '⚡', target: 1, reward: 2000, check: c => (c.pet && c.pet.form === 'awakened' ? 1 : 0) },
  { id: 'p_8', category: 'pet', title: '日常回归', desc: '连续 7 天登录', icon: '📅', target: 7, reward: 300, check: c => c.totalCheckins },

  // 连击类
  { id: 'cb_1', category: 'combo', title: '组合技', desc: '连击 ×5', icon: '🔥', target: 5, reward: 20, check: c => c.bestCombo },
  { id: 'cb_2', category: 'combo', title: '连击达人', desc: '连击 ×10', icon: '🔥', target: 10, reward: 50, check: c => c.bestCombo },
  { id: 'cb_3', category: 'combo', title: '连击狂魔', desc: '连击 ×20', icon: '🌋', target: 20, reward: 200, check: c => c.bestCombo },
  { id: 'cb_4', category: 'combo', title: '神之连击', desc: '连击 ×50', icon: '💥', target: 50, reward: 1000, check: c => c.bestCombo },
  { id: 'cb_5', category: 'combo', title: '无限之链', desc: '连击 ×100', icon: '♾️', target: 100, reward: 5000, check: c => c.bestCombo },

  // 觉醒类
  { id: 'a_1', category: 'awaken', title: '初次觉醒', desc: '觉醒任意 1 次', icon: '⚡', target: 1, reward: 500, check: c => c.awakenCount },
  { id: 'a_2', category: 'awaken', title: '觉醒 5 阶', desc: '累计觉醒 5 次', icon: '⚡', target: 5, reward: 2000, check: c => c.awakenCount },
  { id: 'a_3', category: 'awaken', title: '觉醒 20 阶', desc: '累计觉醒 20 次', icon: '⚡', target: 20, reward: 10000, check: c => c.awakenCount },
  { id: 'a_4', category: 'awaken', title: '万阶觉醒', desc: '累计觉醒 100 次', icon: '🌌', target: 100, reward: 50000, check: c => c.awakenCount },
  { id: 'a_5', category: 'awaken', title: '全主题觉醒', desc: '12 主题全部觉醒 1 阶', icon: '🌈', target: 12, reward: 30000, check: c => awakenedZones(c) },
]

const totalCollected = (c: AchievementCtx): number =>
  Object.values(c.collection).reduce((s, arr) => s + arr.length, 0)

const clearedZones = (c: AchievementCtx): number =>
  Object.values(c.zoneMax).filter(v => v >= 11).length

const maxZoneMax = (c: AchievementCtx): number =>
  Math.max(0, ...Object.values(c.zoneMax))

const awakenedZones = (c: AchievementCtx): number =>
  Object.values(c.zoneMax).filter(v => v >= 12).length

export const computeAchievementProgress = (a: Achievement, ctx: AchievementCtx): { progress: number; done: boolean } => {
  const p = Math.min(a.target, a.check(ctx))
  return { progress: p, done: p >= a.target }
}
