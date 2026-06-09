/**
 * 本地排行榜 v0.6
 * - 纯 localStorage，多玩家并存
 * - 3 个榜单：最高连击 / 最高等级 / 通关主题数
 */
import { MAX_LEVEL, type ZoneId } from '@/data/emoji-trees'

const STORAGE_KEY = 'emoji2048_leaderboard_v1'

export interface LeaderboardEntry {
  id: string
  name: string
  bestCombo: number
  maxLevel: number
  clearedZones: number
  totalPulls: number
  updatedAt: number
}

const loadBoard = (): LeaderboardEntry[] => {
  if (typeof localStorage === 'undefined') return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch { return [] }
}

const saveBoard = (entries: LeaderboardEntry[]) => {
  if (typeof localStorage === 'undefined') return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries))
}

export const submitEntry = (entry: Omit<LeaderboardEntry, 'id' | 'updatedAt'>): LeaderboardEntry => {
  const all = loadBoard()
  const id = `lb_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
  const newEntry: LeaderboardEntry = { ...entry, id, updatedAt: Date.now() }
  all.push(newEntry)
  // 只保留每个玩家最新一条
  const dedup = Object.values(
    all.reduce((acc, e) => {
      acc[e.name] = e
      return acc
    }, {} as Record<string, LeaderboardEntry>)
  )
  saveBoard(dedup)
  return newEntry
}

export const getTopEntries = (sortBy: keyof Omit<LeaderboardEntry, 'id' | 'name' | 'updatedAt'>, limit = 10): LeaderboardEntry[] => {
  return [...loadBoard()].sort((a, b) => b[sortBy] - a[sortBy]).slice(0, limit)
}

export const computeMyEntry = (name: string, ctx: { bestCombo: number; maxLevel: number; zoneMax: Record<ZoneId, number>; totalPulls: number }): Omit<LeaderboardEntry, 'id' | 'updatedAt'> => {
  const cleared = Object.values(ctx.zoneMax).filter(v => v >= MAX_LEVEL).length
  return {
    name,
    bestCombo: ctx.bestCombo,
    maxLevel: ctx.maxLevel,
    clearedZones: cleared,
    totalPulls: ctx.totalPulls,
  }
}

export const defaultName = (): string => {
  const adjectives = ['安静', '勇敢', '聪明', '神秘', '温柔', '机智', '活泼', '坚定']
  const nouns = ['森林', '河流', '星空', '海洋', '山岚', '云海', '雾霭', '月华']
  return `${adjectives[Math.floor(Math.random() * adjectives.length)]}的${nouns[Math.floor(Math.random() * nouns.length)]}`
}
