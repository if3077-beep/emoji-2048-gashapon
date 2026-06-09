/**
 * 宠物装扮系统 v0.5
 * - 装备后宠物显示 overlay emoji
 * - 解锁方式：完成成就/签到第 7 天/活动
 */
export type OutfitId = 'sun_crown' | 'crown' | 'sakura' | 'party' | 'wizard' | 'cactus' | 'rainbow'

export interface Outfit {
  id: OutfitId
  name: string
  overlay: string  // 显示在宠物头顶
  /** 解锁条件描述 */
  unlockDesc: string
  /** 解锁需要的成就 ID（可选） */
  unlockBy?: string
  /** 是否限定 */
  exclusive?: boolean
}

export const OUTFITS: Outfit[] = [
  { id: 'crown',    name: '王冠',     overlay: '👑', unlockDesc: '通关任意 1 个主题' },
  { id: 'sun_crown',name: '太阳冠',   overlay: '🌞', unlockDesc: '7 日签到全勤', exclusive: true },
  { id: 'sakura',   name: '樱花',     overlay: '🌸', unlockDesc: '春日活动（春季签到）' },
  { id: 'party',    name: '派对帽',   overlay: '🥳', unlockDesc: '完成成就 m_3（合成 200 次）' },
  { id: 'wizard',   name: '法师帽',   overlay: '🎩', unlockDesc: '完成成就 a_2（觉醒 5 阶）' },
  { id: 'cactus',   name: '仙人掌',   overlay: '🌵', unlockDesc: '完成成就 c_2（30 emoji）' },
  { id: 'rainbow',  name: '彩虹',     overlay: '🌈', unlockDesc: '完成成就 c_7（全主题通关）' },
]

export const getOutfit = (id: OutfitId | null): Outfit | null => {
  if (!id) return null
  return OUTFITS.find(o => o.id === id) ?? null
}
