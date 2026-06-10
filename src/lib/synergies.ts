/**
 * v0.9 主题羁绊系统
 * - 12 主题两两配对：凑齐 2 个区域都达到 Lv.10 → 解锁被动加成
 * - 每对羁绊提供 1 个 buff：coin_mult / crit_rate / luck
 */
import type { ZoneId } from '@/data/emoji-trees'
import { ZONES } from '@/data/emoji-trees'

export type SynergyBuffKind = 'coin_mult' | 'crit_rate' | 'luck'

export interface Synergy {
  id: string
  emoji: string
  title: string
  desc: string
  pair: [ZoneId, ZoneId]
  buff: SynergyBuffKind
  buffValue: number
}

export const SYNERGIES: Synergy[] = [
  { id: 'nature_breath',  emoji: '🌿', title: '万物有灵',   desc: '生物圈 + 植物界',      pair: ['creature', 'plant'],       buff: 'coin_mult', buffValue: 0.10 },
  { id: 'magic_circuit',  emoji: '🔮', title: '魔力回路',   desc: '元素殿 + 神话殿',      pair: ['element', 'mythology'],    buff: 'crit_rate', buffValue: 0.02 },
  { id: 'taste_of_world', emoji: '🍜', title: '人间烟火',   desc: '美食街 + 人文阁',      pair: ['food', 'culture'],         buff: 'coin_mult', buffValue: 0.10 },
  { id: 'star_symphony',  emoji: '🎵', title: '星际交响',   desc: '星际航 + 音符符',      pair: ['cosmic', 'music'],         buff: 'luck',      buffValue: 0.05 },
  { id: 'city_blueprint', emoji: '🏛️', title: '城市蓝图',  desc: '建筑谱 + 复古厅',      pair: ['architecture', 'retro'],  buff: 'coin_mult', buffValue: 0.10 },
  { id: 'dream_diver',    emoji: '🌊', title: '梦境潜游',   desc: '梦境海 + 深蓝海',      pair: ['dream', 'ocean'],          buff: 'crit_rate', buffValue: 0.02 },
]

/** 检查一个羁绊是否激活（双方区域都 Lv.10+） */
export const isSynergyActive = (syn: Synergy, zoneMax: Partial<Record<ZoneId, number>>): boolean => {
  return (zoneMax[syn.pair[0]] ?? 0) >= 10 && (zoneMax[syn.pair[1]] ?? 0) >= 10
}

/** 计算所有激活羁绊的总 buff */
export const sumActiveSynergyBuff = (
  zoneMax: Partial<Record<ZoneId, number>>,
  buffKind: SynergyBuffKind,
): number => {
  return SYNERGIES
    .filter(s => isSynergyActive(s, zoneMax) && s.buff === buffKind)
    .reduce((sum, s) => sum + s.buffValue, 0)
}

/** 获取所有激活的羁绊 */
export const getActiveSynergies = (zoneMax: Partial<Record<ZoneId, number>>): Synergy[] =>
  SYNERGIES.filter(s => isSynergyActive(s, zoneMax))

/** 计算世界进度：12 个区每个 maxLevel/11 占比 */
export const computeWorldProgress = (zoneMax: Partial<Record<ZoneId, number>>): number => {
  const total = Object.keys(ZONES).length
  const sum = Object.values(zoneMax).reduce((s, lv) => s + Math.min(11, lv ?? 0), 0)
  return sum / (total * 11)
}
