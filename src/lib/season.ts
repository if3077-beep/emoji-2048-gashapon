/**
 * 季节活动 v0.3
 * - 每天（基于日期）确定一个季节 + 一个幸运区
 * - 当前主题匹配季节 → 奖励 ×2（merge_season）
 * - 当前主题是幸运区 → 奖励 ×1.5（merge_lucky）
 * - 5% 暴击概率 → 奖励 ×5（merge_crit）
 */
import { ZONE_LIST, ZONES, type ZoneId } from '@/data/emoji-trees'

export type Season = 'spring' | 'summer' | 'autumn' | 'winter'

const SEASON_ZONES: Record<Season, ZoneId[]> = {
  spring: ['plant', 'creature', 'dream'],
  summer: ['food', 'music', 'ocean'],
  autumn: ['culture', 'element', 'architecture'],
  winter: ['cosmic', 'mythology', 'retro'],
}

const SEASON_EMOJI: Record<Season, string> = {
  spring: '🌸', summer: '☀️', autumn: '🍁', winter: '❄️',
}

const SEASON_LABEL: Record<Season, string> = {
  spring: '春', summer: '夏', autumn: '秋', winter: '冬',
}

const dateKeyOf = (d: Date): string =>
  `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`

/** 根据日期哈希 → 季节 */
export const getSeason = (d: Date = new Date()): Season => {
  const seasons: Season[] = ['spring', 'summer', 'autumn', 'winter']
  const h = dateKeyOf(d).split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)
  return seasons[h % 4]!
}

/** 今日的幸运区（哈希选一个） */
export const getLuckyZone = (d: Date = new Date()): ZoneId => {
  const h = dateKeyOf(d).split('').reduce((acc, c) => acc * 31 + c.charCodeAt(0), 0)
  return ZONE_LIST[Math.abs(h) % ZONE_LIST.length]!.id
}

/** 当前区是否享受季节加成 */
export const isSeasonMatch = (zone: ZoneId, season: Season): boolean =>
  SEASON_ZONES[season].includes(zone)

/** 当前区是否是今日幸运区 */
export const isLuckyZone = (zone: ZoneId, luckyZone: ZoneId): boolean =>
  zone === luckyZone

/** 暴击概率（5%） */
export const rollCrit = (): boolean => Math.random() < 0.05

export const seasonEmoji = (s: Season): string => SEASON_EMOJI[s]
export const seasonLabel = (s: Season): string => SEASON_LABEL[s]

/** 计算给玩家的全 buff 摘要 */
export interface BuffSummary {
  season: Season
  luckyZone: ZoneId
  luckyZoneName: string
  /** 当前 zone 享受的总倍率 */
  multiplier: number
  reasons: string[]
}

export const computeBuff = (currentZone: ZoneId, d: Date = new Date()): BuffSummary => {
  const season = getSeason(d)
  const luckyZone = getLuckyZone(d)
  let mul = 1
  const reasons: string[] = []
  if (isSeasonMatch(currentZone, season)) {
    mul *= 2
    reasons.push(`季节×2`)
  }
  if (isLuckyZone(currentZone, luckyZone)) {
    mul *= 1.5
    reasons.push(`幸运区×1.5`)
  }
  return {
    season,
    luckyZone,
    luckyZoneName: ZONES[luckyZone]?.name ?? luckyZone,
    multiplier: Math.round(mul * 100) / 100,
    reasons,
  }
}
