/**
 * 签到系统 v0.4
 * - 7 日循环，每日递增奖励，第 7 天送限定宠物装扮
 * - 错过 1 天 = 断签（重置回 Day 1）
 * - 连续登录 7 天解锁"Sun Crown"限定装扮
 */
import { nextId } from './rng'

export interface CheckinState {
  /** 今日是否已签到（按日期 YYYY-MM-DD 比对） */
  lastCheckinDate: string | null
  /** 当前连签天数（1-7） */
  streak: number
  /** 历史累计签到次数 */
  totalCheckins: number
  /** 是否已解锁第 7 天大奖 */
  unlockedExclusiveOutfit: boolean
  /** 已领取的限定装扮列表 */
  unlockedOutfits: string[]
}

export const initialCheckinState = (): CheckinState => ({
  lastCheckinDate: null,
  streak: 0,
  totalCheckins: 0,
  unlockedExclusiveOutfit: false,
  unlockedOutfits: [],
})

/** 7 日签到奖励表 */
export const CHECKIN_REWARDS: Array<{ day: number; coins: number; bonus?: { kind: 'gacha' | 'mythic' | 'outfit' | 'level'; value: string | number }; emoji: string; label: string }> = [
  { day: 1, coins: 10, emoji: '🪙', label: '10 币' },
  { day: 2, coins: 30, emoji: '🪙', label: '30 币' },
  { day: 3, coins: 50, bonus: { kind: 'gacha', value: 1 }, emoji: '🎰', label: '50 币 + 1 扭' },
  { day: 4, coins: 80, emoji: '🪙', label: '80 币' },
  { day: 5, coins: 100, bonus: { kind: 'mythic', value: 1 }, emoji: '✨', label: '100 币 + 1 神' },
  { day: 6, coins: 150, emoji: '🪙', label: '150 币' },
  { day: 7, coins: 200, bonus: { kind: 'outfit', value: 'sun_crown' }, emoji: '👑', label: '200 币 + 太阳冠' },
]

const dateKey = (d: Date = new Date()): string => {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

const dayDiff = (a: string, b: string): number => {
  const aD = new Date(a).getTime()
  const bD = new Date(b).getTime()
  return Math.floor((aD - bD) / 86_400_000)
}

export const getTodayKey = (): string => dateKey()

/** 是否今日已签到 */
export const hasCheckedInToday = (state: CheckinState): boolean =>
  state.lastCheckinDate === dateKey()

/**
 * 执行签到，返回新状态 + 今日奖励
 * - 断签：streak 重置为 1
 * - 连续：streak +1，到 7 之后再签重置
 */
export const doCheckin = (state: CheckinState, today: Date = new Date()): { state: CheckinState; reward?: typeof CHECKIN_REWARDS[number]; alreadyDone: boolean } => {
  const todayK = dateKey(today)
  if (state.lastCheckinDate === todayK) {
    return { state, alreadyDone: true }
  }

  // 计算新 streak
  let newStreak: number
  if (state.lastCheckinDate && dayDiff(todayK, state.lastCheckinDate) === 1) {
    newStreak = state.streak + 1
  } else {
    newStreak = 1  // 第一次或断签
  }
  if (newStreak > 7) newStreak = 1  // 超过 7 重新循环

  const reward = CHECKIN_REWARDS[newStreak - 1]!
  const newOutfits = [...state.unlockedOutfits]
  let unlockedExclusive = state.unlockedExclusiveOutfit
  if (reward.bonus?.kind === 'outfit' && !newOutfits.includes(reward.bonus.value as string)) {
    newOutfits.push(reward.bonus.value as string)
    unlockedExclusive = true
  }

  return {
    state: {
      ...state,
      lastCheckinDate: todayK,
      streak: newStreak,
      totalCheckins: state.totalCheckins + 1,
      unlockedExclusiveOutfit: unlockedExclusive,
      unlockedOutfits: newOutfits,
    },
    reward,
    alreadyDone: false,
  }
}

/** 计算回归天数（0 = 今日） */
export const getDaysSinceLastSeen = (lastSeen: number | null): number => {
  if (lastSeen === null) return 0
  const now = Date.now()
  return Math.floor((now - lastSeen) / 86_400_000)
}

/** 计算回归大礼包（错过 N 天的奖励） */
export const calcComebackReward = (daysSince: number): { coins: number; gacha: number; mythic: number } => {
  if (daysSince < 1) return { coins: 0, gacha: 0, mythic: 0 }
  if (daysSince >= 7) return { coins: 500, gacha: 5, mythic: 2 }
  if (daysSince >= 3) return { coins: 200, gacha: 2, mythic: 1 }
  return { coins: 50, gacha: 1, mythic: 0 }
}

/**
 * 7 日挑战（每日 3 个，比 daily 难）
 * 不与 daily 重复，每天根据日期哈希生成稳定列表
 */
export interface Challenge {
  id: string
  desc: string
  target: number
  reward: { coins: number; gacha?: number }
}

const CHALLENGE_POOL: Array<Omit<Challenge, 'id' | 'reward'> & { rewardCoins: number; rewardGacha?: number }> = [
  { desc: '合成 20 次', target: 20, rewardCoins: 30, rewardGacha: 1 },
  { desc: '达到 Lv.8', target: 8, rewardCoins: 50 },
  { desc: '解锁 2 个新区', target: 2, rewardCoins: 80, rewardGacha: 1 },
  { desc: '连击 ×10', target: 10, rewardCoins: 30 },
  { desc: '扭蛋 10 次', target: 10, rewardCoins: 25 },
  { desc: '喂食宠物 3 次', target: 3, rewardCoins: 20 },
  { desc: '抚摸宠物 5 次', target: 5, rewardCoins: 15 },
  { desc: '觉醒任意 1 次', target: 1, rewardCoins: 100, rewardGacha: 1 },
  { desc: '集齐 1 个区 11 个等级', target: 11, rewardCoins: 150, rewardGacha: 2 },
  { desc: '完成 3 个日常任务', target: 3, rewardCoins: 25 },
]

export const generateChallenges = (dateKey: string): Challenge[] => {
  const seed = dateKey.split('').reduce((s, c) => s * 31 + c.charCodeAt(0), 0)
  const shuffled = [...CHALLENGE_POOL].sort((a, b) => {
    const aH = Math.sin(seed + a.desc.length) * 10000
    const bH = Math.sin(seed + b.desc.length) * 10000
    return (aH - Math.floor(aH)) - (bH - Math.floor(bH))
  })
  return shuffled.slice(0, 3).map(c => ({
    id: nextId('chl'),
    desc: c.desc,
    target: c.target,
    reward: { coins: c.rewardCoins, gacha: c.rewardGacha },
  }))
}
