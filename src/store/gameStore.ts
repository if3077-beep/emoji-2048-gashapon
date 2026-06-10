/**
 * 游戏主状态（v0.2：事件奖励 + 滑动 + 觉醒）
 */
import { create } from 'zustand'
import type { ZoneId } from '@/data/emoji-trees'
import { ZONES, MAX_LEVEL, GRID_SIZE, ZONE_LIST, getEmoji } from '@/data/emoji-trees'
import {
  type Grid,
  type Tile,
  type Collection,
  emptyGrid,
  drawCapsule,
  placeCapsule,
  dragMerge,
  emptyCollection,
  findMaxLevel,
  findZoneMax,
  slide as slideGrid,
  type SlideResult,
  type MoveRecord,
  type MergeEvent,
  isFull,
  canAnyMove,
  deadlockRelief,
} from '@/lib/merge-engine'
import { autoMerge as autoMergeEngine, findLongestMatch, type MatchGroup } from '@/lib/auto-merge'
import { generatePet, feedPet, petPet, computeForm, type Pet, type PetForm } from '@/lib/pet-gen'
import { generateDailyTasks, updateTaskProgress, type DailyTask } from '@/lib/task-system'
import { loadSave, writeSave } from '@/lib/persistence'
import { nextId } from '@/lib/rng'
import { calcReward, getReward, type EventKind } from '@/lib/event-rewards'
import { computeBuff, rollCrit } from '@/lib/season'
import {
  initialCheckinState,
  doCheckin,
  hasCheckedInToday,
  generateChallenges,
  calcComebackReward,
  getDaysSinceLastSeen,
  type CheckinState,
  type Challenge,
} from '@/lib/checkin'
import type { OutfitId } from '@/lib/outfits'
import { rollRandomEvent } from '@/lib/events'
import { detectUnlockedAchievements, type Achievement } from '@/lib/achievements'

interface GameState {
  // 基础
  coins: number
  totalPulls: number
  mergeCount: number
  combo: number
  bestCombo: number
  /** v5.3 连续成功滑动次数（每 3 次 +5🪙，失败清零） */
  slideStreak: number
  maxLevel: number
  zoneMax: Record<ZoneId, number>
  currentZone: ZoneId
  grid: Grid
  collection: Record<ZoneId, number[]>

  // 宠物
  pet: Pet | null
  petEggStartedAt: number | null

  // 任务
  dailyTasks: DailyTask[]
  dailyDateKey: string

  // v0.4 签到 + 挑战
  checkin: CheckinState
  challenges: Challenge[]
  challengesDateKey: string
  /** 上次离开时间（用于回归奖励） */
  lastSeenAt: number
  /** 今日启动时是否已发放回归奖励 */
  comebackClaimed: boolean
  /** 限时弹出"宠物想你" */
  pendingComeback: { daysSince: number; reward: { coins: number; gacha: number; mythic: number } } | null
  /** 限时弹出"宠物晚安"（离开前） */
  pendingGoodnight: boolean

  // 历史统计（v0.4 数据面板）
  history: {
    totalSessions: number
    longestCombo: number
    totalEarned: number
    totalSpent: number
    firstPlayedAt: number
    /** 每天最高合成等级（最近 7 天） */
    levelByDay: number[]
  }

  // 教程
  tutorialStep: number

  // v0.7 随机事件 buff（同时只能有 1 个持续类）
  activeEventBuff: { id: string; emoji: string; title: string; expiresAt: number; color: string } | null
  /** 待显示的随机事件（全屏卡片） */
  pendingRandomEvent: { emoji: string; title: string; desc: string; color: string; durationMs?: number } | null
  /** 本次扭蛋是否免单（gacha_frenzy 触发后） */
  freeGachaPending: boolean

  // v1.1 成就
  /** 已解锁的成就 id 列表（持久化） */
  unlockedAchievements: string[]
  /** 待弹出的成就队列 */
  pendingAchievements: Achievement[]
  /** 当前展示的成就 */
  currentAchievement: Achievement | null
  // v2.0 死局
  /** 是否进入卡死（满格 + 4 方向无任何合成） */
  isDeadlocked: boolean

  // 操作
  pull: (multi?: number) => void
  slide: (dir: 'up' | 'down' | 'left' | 'right') => SlideResult
  /** v0.7：一键合并（贪心自动滑动直到无事件） */
  autoMerge: () => { totalEvents: MergeEvent[]; totalMoves: number; rounds: number }
  merge: (from: [number, number], to: [number, number]) => boolean
  setZone: (z: ZoneId) => void
  spendCoins: (n: number) => boolean
  addCoins: (n: number) => void
  reset: () => void
  save: () => void
  load: () => void
  updateTasks: (predicate: (t: DailyTask) => boolean, delta?: number) => void
  claimTask: (taskId: string) => void
  hatchEgg: () => Pet
  setPet: (p: Pet | null) => void
  advanceTutorial: () => void
  // v0.3 宠物互动
  feedPetAction: () => { ok: boolean; formChanged: boolean; newForm?: PetForm; reward?: number; intensity?: 0 | 1 | 2 | 3 }
  petPetAction: () => boolean
  // v0.4 签到 / 挑战
  doCheckinAction: () => ReturnType<typeof doCheckin>
  claimChallenge: (id: string) => boolean
  setGoodnight: (v: boolean) => void
  claimComeback: () => void
  /** 启动时计算回归奖励（写入 pendingComeback） */
  detectComeback: () => void
  /** 关页面前调用 */
  beforeUnload: () => void
  // v0.7 随机事件
  triggerRandomEvent: () => void
  dismissRandomEvent: () => void
  clearEventBuff: () => void
  // v1.1 成就
  /** 内部：检测新解锁成就，写入队列 */
  _checkAchievements: () => void
  /** 关闭当前成就祝贺（队列下一个顶上） */
  dismissCurrentAchievement: () => void
  /** 清空成就队列 */
  clearAchievementQueue: () => void
  // v2.0 死局与 spawn
  /** v2.0：尝试在网格中放一个新 tile（如果有空位） */
  trySpawnOne: () => boolean
  /** v8.2 满格自动救济：主动清 1 颗 Lv.1-2 喘息（返回清除数量 0/1） */
  autoRelief: () => number
  /**
   * v9.0 刷新网格：保留 Lv.4+ 和觉醒形态，回退其他为空 + spawn 2-3 个 Lv.1
   * - cost: 主动刷新的费用（默认 5🪙，死局强救济传 0）
   * - 返回实际清除的数量
   */
  refreshGrid: (cost?: number) => number
  /** v2.0：死局检测（满格 + 无任何合成） */
  checkDeadlock: () => boolean
  /** v2.0：死局兜底（清 Lv.1-3，保留 Lv.4+，奖 50 🪙） */
  resolveDeadlock: () => { cleared: number; kept: number } | null
  /** v2.0：清死局状态 */
  clearDeadlock: () => void
}

const todayKey = (): string => {
  const d = new Date()
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`
}

const init = () => {
  const saved = loadSave()
  if (saved) {
    return {
      coins: saved.coins ?? 10,
      totalPulls: saved.totalPulls ?? 0,
      mergeCount: saved.mergeCount ?? 0,
      combo: saved.combo ?? 0,
      bestCombo: saved.bestCombo ?? 0,
      slideStreak: 0,
      maxLevel: saved.maxLevel ?? 0,
      zoneMax: saved.zoneMax ?? defaultZoneMax(),
      currentZone: saved.currentZone ?? ('creature' as ZoneId),
      grid: saved.grid ?? emptyGrid(),
      collection: saved.collection ?? defaultCollection(),
      pet: saved.pet ?? null,
      petEggStartedAt: saved.petEggStartedAt ?? null,
      dailyTasks: saved.dailyDateKey === todayKey() ? (saved.dailyTasks ?? []) : generateDailyTasks(todayKey()),
      dailyDateKey: saved.dailyDateKey ?? todayKey(),
      checkin: saved.checkin ?? initialCheckinState(),
      challenges: saved.challengesDateKey === todayKey() ? (saved.challenges ?? []) : generateChallenges(todayKey()),
      challengesDateKey: saved.challengesDateKey ?? todayKey(),
      lastSeenAt: saved.lastSeenAt ?? Date.now(),
      comebackClaimed: saved.comebackClaimed ?? false,
      pendingComeback: null,
      pendingGoodnight: false,
      history: saved.history ?? {
        totalSessions: 1,
        longestCombo: saved.bestCombo ?? 0,
        totalEarned: 0,
        totalSpent: 0,
        firstPlayedAt: Date.now(),
        levelByDay: [],
      },
      tutorialStep: saved.tutorialStep ?? 1,
      activeEventBuff: null,
      pendingRandomEvent: null,
      freeGachaPending: false,
      // v1.1 成就
      unlockedAchievements: saved.unlockedAchievements ?? [],
      pendingAchievements: [],
    currentAchievement: null,
    isDeadlocked: false,
  }
}
  return {
    coins: 10,
    totalPulls: 0,
    mergeCount: 0,
    combo: 0,
    bestCombo: 0,
    slideStreak: 0,
    maxLevel: 0,
    zoneMax: defaultZoneMax(),
    currentZone: 'creature' as ZoneId,
    grid: emptyGrid(),
    collection: defaultCollection(),
    pet: null,
    petEggStartedAt: null,
    dailyTasks: generateDailyTasks(todayKey()),
    dailyDateKey: todayKey(),
    checkin: initialCheckinState(),
    challenges: generateChallenges(todayKey()),
    challengesDateKey: todayKey(),
    lastSeenAt: Date.now(),
    comebackClaimed: false,
    pendingComeback: null,
    pendingGoodnight: false,
    history: {
      totalSessions: 1,
      longestCombo: 0,
      totalEarned: 0,
      totalSpent: 0,
      firstPlayedAt: Date.now(),
      levelByDay: [],
    },
    tutorialStep: 1,
    activeEventBuff: null,
    pendingRandomEvent: null,
    freeGachaPending: false,
    // v1.1 成就
    unlockedAchievements: [],
    pendingAchievements: [],
    currentAchievement: null,
    // v2.0 死局
    isDeadlocked: false,
  }
}

const defaultZoneMax = (): Record<ZoneId, number> => {
  const out = {} as Record<ZoneId, number>
  ZONE_LIST.forEach(z => { out[z.id] = 0 })
  return out
}

const defaultCollection = (): Record<ZoneId, number[]> => {
  const out = {} as Record<ZoneId, number[]>
  ZONE_LIST.forEach(z => { out[z.id] = [] })
  return out
}

const initial = init()

/** 计算事件最终奖励（带连击、好感系数） */
const computeRewardAmount = (
  kind: EventKind,
  combo: number,
  affection: number,
  level: number,
): number => {
  // 觉醒 / 神话 / 史诗 / 稀有事件用基础奖励 × 等级系数
  const levelMul = kind.startsWith('merge_') && kind !== 'merge_basic' && kind !== 'merge_first' && kind !== 'merge_combo'
    ? (1 + (level - 1) * 0.1)
    : 1
  const calc = calcReward(kind, {
    combo: Math.max(1, combo),
    affection,
    level: levelMul,
  })
  return calc.final
}

export const useGameStore = create<GameState>((set, get) => ({
  ...initial,

  pull: (multi = 1) => {
    const state = get()
    const cost = multi === 10 ? 9 : multi
    if (state.coins < cost) return
    let { grid, coins, totalPulls, mergeCount, maxLevel, zoneMax, combo, collection } = state
    coins -= cost
    let newPetEggStarted = state.petEggStartedAt
    let newlyHatched: Pet | null = null

    for (let i = 0; i < multi; i++) {
      const cap = drawCapsule(state.currentZone, state.pet?.level ?? 0)
      const result = placeCapsule(grid, cap)
      grid = result.grid
      totalPulls++

      if (result.merged) {
        const [r, c] = result.mergedAt!
        const t = grid[r]?.[c]!
        if (t) {
          if (!collection[t.zone].includes(t.level)) {
            collection = { ...collection, [t.zone]: [...collection[t.zone], t.level].sort((a, b) => a - b) }
          }
          if (t.level > maxLevel) maxLevel = t.level
          if (t.level > zoneMax[t.zone]) zoneMax = { ...zoneMax, [t.zone]: t.level }
          mergeCount++
          // 出蛋：Lv.10
          // v0.7 宠物早产：Lv.4 → 蛋；Lv.5 → 孵化（玩家 2 分钟内必拿宠物）
          if (t.level === 4 && !state.pet && newPetEggStarted === null) {
            newPetEggStarted = Date.now()
          }
          if (t.level === 5 && !state.pet && newPetEggStarted !== null) {
            newlyHatched = generatePet({ triggerLevel: t.level })
          }
          // 投放合并的货币奖励
          const reward = computeRewardAmount('merge_basic', 1, 0, t.level)
          coins += reward
        }
      }
    }

    combo = 0
    const updates: any = { grid, coins, totalPulls, maxLevel, zoneMax, collection, mergeCount, combo }
    if (newPetEggStarted) updates.petEggStartedAt = newPetEggStarted
    if (newlyHatched) {
      updates.pet = newlyHatched
      updates.petEggStartedAt = null
      coins += 100  // 宠物降生奖励
    }
    set(updates)
    get().updateTasks(t => t.desc.includes('扭蛋'), 1)
    if (maxLevel >= 5) get().updateTasks(t => t.desc.includes('Lv.5'), 1)
    // v1.3 宠物孵化音效
    if (newlyHatched) {
      try { (require('@/lib/audio') as typeof import('@/lib/audio')).sfx.petBorn() } catch {}
    }
    // v1.1 检测成就
    get()._checkAchievements()
  },

  slide: (dir) => {
    const state = get()
    const result = slideGrid(state.grid, dir, state.collection)
    if (!result.moved) {
      // 滑动无效 → 断连击
      if (state.combo > 0) set({ combo: 0 })
      // v5.3 streak 清零
      if (state.slideStreak > 0) set({ slideStreak: 0 })
      return result
    }

    let { coins, combo, bestCombo, mergeCount, maxLevel, zoneMax, collection, slideStreak } = state
    combo++
    if (combo > bestCombo) bestCombo = combo
    // v5.3 streak：连续成功滑动
    slideStreak++
    let streakBonus = 0
    if (slideStreak > 0 && slideStreak % 3 === 0) {
      // 每 3 次连续成功滑动奖励 5 币
      streakBonus = 5
      coins += streakBonus
    }

    // 累计 mergeCount
    mergeCount += result.events.length

    // v0.3：季节 + 幸运区 + 暴击 buff（所有事件共享）
    const buff = computeBuff(state.currentZone)
    const isCrit = rollCrit()
    const isLucky = buff.multiplier > 1
    const critMul = isCrit ? 5 : 1

    // 处理每个合并事件
    for (const evt of result.events) {
      if (!collection[evt.zone].includes(evt.level)) {
        collection = { ...collection, [evt.zone]: [...collection[evt.zone], evt.level].sort((a, b) => a - b) }
      }
      if (evt.level > maxLevel) maxLevel = evt.level
      if (evt.level > zoneMax[evt.zone]) zoneMax = { ...zoneMax, [evt.zone]: evt.level }

      // 计算奖励（buff × combo × 等级 × 好感）
      const reward = computeRewardAmount(evt.kind, combo, state.pet?.affection ?? 0, evt.level)
      let totalReward = reward
      // 暴击 ×5
      if (isCrit) totalReward = totalReward * 5
      // 季节/幸运区乘 buff
      if (isLucky) totalReward = Math.round(totalReward * buff.multiplier)
      coins += totalReward

      // 收集事件用于 UI 反馈（v0.3 让组件知道是否暴击/幸运）
      ;(evt as any).finalReward = totalReward
      ;(evt as any).isCrit = isCrit
      ;(evt as any).isLucky = isLucky
    }

    // 宠物触发：v0.7 改为 Lv.4 → 蛋；Lv.5 → 孵化
    let newPetEggStarted = state.petEggStartedAt
    let newlyHatched: Pet | null = null
    for (const evt of result.events) {
      if (evt.level === 4 && !state.pet && newPetEggStarted === null) {
        newPetEggStarted = Date.now()
      }
      if (evt.level === 5 && !state.pet && newPetEggStarted !== null) {
        newlyHatched = generatePet({ triggerLevel: evt.level })
        coins += 100
      }
    }

    const updates: any = {
      grid: result.grid,
      coins,
      combo,
      bestCombo,
      slideStreak,
      mergeCount,
      maxLevel,
      zoneMax,
      collection,
    }
    if (newPetEggStarted) updates.petEggStartedAt = newPetEggStarted
    if (newlyHatched) {
      updates.pet = newlyHatched
      updates.petEggStartedAt = null
    }
    set(updates)
    get().updateTasks(t => t.desc.includes('合成'), 1)

    // v5.3 streak 满 3 推送 toast + 奖励音效
    if (streakBonus > 0) {
      try { (require('@/store/uiStore') as typeof import('@/store/uiStore')).useUiStore.getState().pushToast(`🔥 ${slideStreak} 连滑 +${streakBonus}🪙`, '🔥', 2) } catch {}
    }

    // v6.2 稀有时刻：合成 Lv.10+ 触发全屏文字
    const rare = result.events.find(e => e.level >= 10)
    if (rare) {
      try { (require('@/store/uiStore') as typeof import('@/store/uiStore')).useUiStore.getState().triggerRareMoment(getEmoji({ zone: rare.zone, level: rare.level }), rare.level) } catch {}
    }

    // v2.0：slide 后自动 spawn 1 个新 tile（修"slide 后不生成胶囊"卡死 bug）
    const spawnOk = get().trySpawnOne()
    // v8.2 死局自动救济：spawn 失败（满格）→ 主动清 1 颗 Lv.1-2 喘息
    if (!spawnOk) {
      const cleared = get().autoRelief()
      if (cleared > 0) {
        try { (require('@/store/uiStore') as typeof import('@/store/uiStore')).useUiStore.getState().pushToast(`🪦 满格自动清理 ${cleared} 颗低等级`, '🪦', 1) } catch {}
        get().trySpawnOne()  // 再 spawn
      } else {
        // v9.0 强救济：autoRelief 无可清时（高等级全填满）→ 死局救济免费刷新
        const refreshed = get().refreshGrid(0)
        if (refreshed > 0) get().trySpawnOne()
      }
    }
    // v2.0：每次 slide 后检测死局
    get().checkDeadlock()

    // v0.7：合并后尝试触发随机事件
    if (result.events.length > 0) {
      get().triggerRandomEvent()
    }
    return result
  },

  merge: (from, to) => {
    const state = get()
    const result = dragMerge(state.grid, from, to)
    if (!result.success) return false
    const t = result.grid[to[0]]?.[to[1]]!
    let { maxLevel, zoneMax, mergeCount, combo, bestCombo, collection, coins } = state
    maxLevel = Math.max(maxLevel, t.level)
    zoneMax = { ...zoneMax, [t.zone]: Math.max(zoneMax[t.zone], t.level) }
    mergeCount++
    combo++
    if (combo > bestCombo) bestCombo = combo
    if (!collection[t.zone].includes(t.level)) {
      collection = { ...collection, [t.zone]: [...collection[t.zone], t.level].sort((a, b) => a - b) }
    }
    coins += 1  // 拖拽合并也奖励
    set({ grid: result.grid, maxLevel, zoneMax, mergeCount, combo, bestCombo, collection, coins })
    return true
  },

  setZone: (z) => {
    const state = get()
    if (z === state.currentZone) return
    set({ currentZone: z })
    get().updateTasks(t => t.desc.includes('生态区'), 1)
    // v1.3 主题切换音效
    try { (require('@/lib/audio') as typeof import('@/lib/audio')).sfx.whoosh() } catch {}
  },

  spendCoins: (n) => {
    const { coins } = get()
    if (coins < n) return false
    set({ coins: coins - n })
    return true
  },

  addCoins: (n) => set(s => ({ coins: s.coins + n })),

  /** v0.7：一键合并（贪心自动滑动直到无事件），返回事件统计 */
  autoMerge: () => {
    const state = get()
    const result = autoMergeEngine(state.grid)
    if (result.totalEvents.length === 0) {
      return { totalEvents: [], totalMoves: 0, rounds: 0 }
    }
    let { coins, mergeCount, maxLevel, zoneMax, collection, combo, bestCombo } = state
    combo += result.rounds
    if (combo > bestCombo) bestCombo = combo
    mergeCount += result.totalEvents.length
    const buff = computeBuff(state.currentZone)
    const isCrit = rollCrit()
    const isLucky = buff.multiplier > 1
    for (const evt of result.totalEvents) {
      if (!collection[evt.zone].includes(evt.level)) {
        collection = { ...collection, [evt.zone]: [...collection[evt.zone], evt.level].sort((a, b) => a - b) }
      }
      if (evt.level > maxLevel) maxLevel = evt.level
      if (evt.level > zoneMax[evt.zone]) zoneMax = { ...zoneMax, [evt.zone]: evt.level }
      const reward = computeRewardAmount(evt.kind, combo, state.pet?.affection ?? 0, evt.level)
      let totalReward = reward
      if (isCrit) totalReward = totalReward * 5
      if (isLucky) totalReward = Math.round(totalReward * buff.multiplier)
      coins += totalReward
      ;(evt as any).finalReward = totalReward
      ;(evt as any).isCrit = isCrit
      ;(evt as any).isLucky = isLucky
    }
    set({ grid: result.finalGrid, coins, mergeCount, maxLevel, zoneMax, collection, combo, bestCombo })
    get().updateTasks(t => t.desc.includes('合成'), result.totalEvents.length)
    get().triggerRandomEvent()

    // v2.1 消消乐强化：检测最长 match-3/4/5 连锁
    const match = findLongestMatch(result.finalGrid)
    if (match.longest >= 3) {
      const groups = match.groups
      const longest = match.longest
      let bonusCoins = 0
      let bonusCombo = 0
      if (longest === 3) { bonusCoins = 20; bonusCombo = 1 }
      else if (longest === 4) { bonusCoins = 50; bonusCombo = 2 }
      else if (longest >= 5) { bonusCoins = 200; bonusCombo = 3 }
      // 多个连锁组额外 +10 / 组
      bonusCoins += (groups.length - 1) * 10
      set(s => ({ coins: s.coins + bonusCoins, combo: s.combo + bonusCombo, bestCombo: Math.max(s.bestCombo, s.combo + bonusCombo) }))
      try { (require('@/lib/audio') as typeof import('@/lib/audio')).sfx.crit() } catch {}
      // 5+ 连锁召唤"觉醒凝视"全屏慢动作
      if (longest >= 5) {
        try { (require('@/lib/audio') as typeof import('@/lib/audio')).sfx.celebrate() } catch {}
        try { (require('@/lib/bgm') as typeof import('@/lib/bgm')).bgm.switchTo('awaken') } catch {}
        try { (require('@/store/uiStore') as typeof import('@/store/uiStore')).useUiStore.getState().triggerAwakenBurst(groups, longest) } catch {}
      }
      // 4 连锁：额外触发 1 次相邻合成（找 groups 周围的 tile 对，尝试一次 slide）
      if (longest >= 4 && groups.length > 0) {
        const r2 = autoMergeEngine(result.finalGrid, 1)
        if (r2.totalEvents.length > 0) {
          // 把额外合成事件的奖励也算上
          const isCrit2 = rollCrit()
          const isLucky2 = computeBuff(state.currentZone).multiplier > 1
          for (const evt of r2.totalEvents) {
            if (!collection[evt.zone].includes(evt.level)) {
              collection = { ...collection, [evt.zone]: [...collection[evt.zone], evt.level].sort((a, b) => a - b) }
            }
            if (evt.level > maxLevel) maxLevel = evt.level
            if (evt.level > zoneMax[evt.zone]) zoneMax = { ...zoneMax, [evt.zone]: evt.level }
            const reward = computeRewardAmount(evt.kind, combo + bonusCombo, state.pet?.affection ?? 0, evt.level)
            let totalReward = reward
            if (isCrit2) totalReward = totalReward * 5
            if (isLucky2) totalReward = Math.round(totalReward * computeBuff(state.currentZone).multiplier)
            coins += totalReward
          }
          set(s => ({ grid: r2.finalGrid, coins: s.coins, mergeCount: s.mergeCount + r2.totalEvents.length, maxLevel, zoneMax, collection }))
        }
      }
    }

    // v2.0：autoMerge 末尾 spawn + 死局检测
    get().trySpawnOne()
    get().checkDeadlock()

    return result
  },

  updateTasks: (predicate, delta = 1) => {
    const { dailyTasks, dailyDateKey } = get()
    if (dailyDateKey !== todayKey()) {
      set({ dailyTasks: generateDailyTasks(todayKey()), dailyDateKey: todayKey() })
      return
    }
    const { tasks } = updateTaskProgress(dailyTasks, predicate, delta)
    set({ dailyTasks: tasks })
  },

  claimTask: (taskId) => {
    const { dailyTasks, addCoins } = get()
    const next = dailyTasks.map(t => {
      if (t.id === taskId && t.completed && !t.claimed) {
        addCoins(t.reward)
        return { ...t, claimed: true }
      }
      return t
    })
    set({ dailyTasks: next })
  },

  hatchEgg: () => {
    const dominantHue = computeDominantHue(get().collection)
    const pet = generatePet({ dominantHue })
    set({ pet, petEggStartedAt: null })
    return pet
  },

  setPet: (p) => set({ pet: p }),

  advanceTutorial: () => set(s => ({ tutorialStep: s.tutorialStep + 1 })),

  // v0.3：喂食宠物
  feedPetAction: () => {
    const state = get()
    if (!state.pet) return { ok: false, formChanged: false }
    const r = feedPet(state.pet)
    if (r.pet === state.pet && !r.evolved) {
      return { ok: false, formChanged: false }
    }
    set({ pet: r.pet, coins: state.coins + (r.reward ?? 0) })
    return {
      ok: true,
      formChanged: r.formChanged,
      newForm: r.newForm,
      reward: r.reward,
      intensity: r.intensity,
    }
  },

  // v0.3：抚摸宠物
  petPetAction: () => {
    const state = get()
    if (!state.pet) return false
    const r = petPet(state.pet)
    if (!r.ready) return false
    set({ pet: r.pet })
    return true
  },

  // v0.4：签到
  doCheckinAction: () => {
    const state = get()
    const r = doCheckin(state.checkin)
    if (r.alreadyDone || !r.reward) return r
    // 发放奖励
    const bonus = r.reward.bonus
    let addGacha = 0
    let addMythic = 0
    if (bonus?.kind === 'gacha') addGacha = bonus.value as number
    if (bonus?.kind === 'mythic') addMythic = bonus.value as number
    set({
      checkin: r.state,
      coins: state.coins + r.reward.coins,
      totalPulls: state.totalPulls + addGacha,
    })
    // v1.1 检测成就
    get()._checkAchievements()
    return r
  },

  // v0.4：领取挑战
  claimChallenge: (id) => {
    const state = get()
    const next = state.challenges.map(c => {
      if (c.id !== id) return c
      const completed = (c as any)._progress >= c.target
      if (completed && !(c as any)._claimed) {
        const ch = { ...c, _claimed: true } as any
        return ch
      }
      return c
    })
    const ch = state.challenges.find(c => c.id === id) as any
    if (!ch || !ch._claimed || !ch._progress || ch._progress < ch.target) return false
    set({
      challenges: next,
      coins: state.coins + (ch.reward?.coins ?? 0),
    })
    return true
  },

  setGoodnight: (v) => set({ pendingGoodnight: v }),

  claimComeback: () => {
    const state = get()
    if (!state.pendingComeback || state.comebackClaimed) return
    const r = state.pendingComeback.reward
    set({
      coins: state.coins + r.coins,
      totalPulls: state.totalPulls + r.gacha,
      comebackClaimed: true,
      pendingComeback: null,
    })
  },

  detectComeback: () => {
    const state = get()
    const last = state.lastSeenAt
    const days = getDaysSinceLastSeen(last)
    if (days >= 1) {
      const reward = calcComebackReward(days)
      set({
        pendingComeback: { daysSince: days, reward },
      })
    }
    set({ lastSeenAt: Date.now() })
  },

  beforeUnload: () => {
    const state = get()
    set({
      lastSeenAt: Date.now(),
      pendingGoodnight: true,
      history: {
        ...state.history,
        longestCombo: Math.max(state.history.longestCombo, state.bestCombo),
      },
    })
    get().save()
  },

  // v0.7：随机事件触发
  triggerRandomEvent: () => {
    const ev = rollRandomEvent()
    if (!ev) return
    // 持续类 buff 写入 activeEventBuff
    if (ev.durationMs) {
      set({
        activeEventBuff: {
          id: ev.id,
          emoji: ev.emoji,
          title: ev.title,
          expiresAt: Date.now() + ev.durationMs,
          color: ev.color,
        },
      })
    }
    // 即时奖励应用
    const state = get()
    let coins = state.coins
    if (ev.id === 'time_rewind') {
      // 清除 Lv.1-2，每清除一个 +3 币
      let cleared = 0
      const newGrid = state.grid.map(row => row.map(t => {
        if (t && t.level <= 2) { cleared++; return null }
        return t
      }))
      coins += cleared * 3
      set({ grid: newGrid, coins })
    } else if (ev.id === 'mystery_visitor') {
      // 给 1 个随机区域 Lv.5 棋子入网
      const zoneIds = Object.keys(ZONES) as ZoneId[]
      const z = zoneIds[Math.floor(Math.random() * zoneIds.length)]!
      const cap: Tile = { id: nextId('tile'), zone: z, level: 5, bornAt: Date.now() }
      const result = placeCapsule(state.grid, cap)
      set({ grid: result.grid })
    } else if (ev.id === 'gacha_frenzy') {
      set({ freeGachaPending: true })
    } else if (ev.id === 'pet_cuddle') {
      // 下一次喂食翻倍：写入 pendingRewardMultiplier
      // 简化：直接加好感 +10
      if (state.pet) {
        set({ pet: { ...state.pet, affection: Math.min(100, state.pet.affection + 10) } })
      }
    } else if (ev.id === 'element_resonance') {
      // 写入 buff：下一次合并 ×3（由 MergeGrid 在调用 slide 时检测）
      set({ activeEventBuff: { id: ev.id, emoji: ev.emoji, title: ev.title, expiresAt: Date.now() + 5_000, color: ev.color } })
    } else if (ev.id === 'combo_storm') {
      // 已通过 activeEventBuff 实现（30 秒）
    } else if (ev.id === 'guardian_shield') {
      // 滑动失败时由 slide 内部检查
    } else if (ev.id === 'double_hour') {
      // activeEventBuff 持续
    }
    set({ pendingRandomEvent: { emoji: ev.emoji, title: ev.title, desc: ev.desc, color: ev.color, durationMs: ev.durationMs } })
  },

  dismissRandomEvent: () => set({ pendingRandomEvent: null }),

  clearEventBuff: () => set({ activeEventBuff: null }),

  // v1.1 成就系统
  _checkAchievements: () => {
    const state = get()
    const ctx = {
      mergeCount: state.mergeCount,
      totalPulls: state.totalPulls,
      maxLevel: state.maxLevel,
      bestCombo: state.bestCombo,
      awakenCount: state.pet?.awakenCount ?? 0,
      zoneMax: state.zoneMax,
      collection: state.collection,
      pet: state.pet,
      petAffection: state.pet?.affection ?? 0,
      totalCheckins: state.checkin.totalCheckins,
      totalSessions: state.history.totalSessions,
    }
    const newly = detectUnlockedAchievements(ctx, state.unlockedAchievements)
    if (newly.length === 0) return
    const newIds = newly.map(a => a.id)
    // 累计奖励
    const rewardTotal = newly.reduce((s, a) => s + a.reward, 0)
    // 写持久化队列
    const queue = [...state.pendingAchievements, ...newly]
    const next = state.currentAchievement ?? queue[0] ?? null
    const rest = next ? queue.filter(a => a.id !== next.id) : []
    set({
      unlockedAchievements: [...state.unlockedAchievements, ...newIds],
      pendingAchievements: rest,
      currentAchievement: next,
      coins: state.coins + rewardTotal,
    })
  },

  dismissCurrentAchievement: () => {
    const state = get()
    const next = state.pendingAchievements[0] ?? null
    set({
      currentAchievement: next,
      pendingAchievements: next ? state.pendingAchievements.slice(1) : [],
    })
  },

  clearAchievementQueue: () => set({ pendingAchievements: [], currentAchievement: null }),

  // v2.0 死局与 spawn
  /**
   * 尝试在网格中放一个新 tile（如果有空位）
   * - 返回 true 表示成功 spawn
   * - 经典 2048 行为：每次 slide 后都会 spawn 1 个新胶囊
   */
  trySpawnOne: () => {
    const state = get()
    if (isFull(state.grid)) return false
    const cap = drawCapsule(state.currentZone, state.pet?.level ?? 0)
    const result = placeCapsule(state.grid, cap)
    set({ grid: result.grid })
    return true
  },

  // v8.2 init 占位：避免序列化/初始化时缺字段
  autoRelief: () => 0,

  /**
   * v8.2 满格自动救济：主动清 1 颗 Lv.1-2 随机，给玩家喘息
   * - 满格 + spawn 失败时由 slide 末尾调用
   * - 优先清 Lv.1，再清 Lv.2
   * - 返回清除数量（0/1）
   */
  _v8autoRelief: () => {
    const state = get()
    if (!isFull(state.grid)) return 0
    // 找 Lv.1 / Lv.2 候选位置
    const lowLevelCells: Array<[number, number]> = []
    for (let r = 0; r < state.grid.length; r++) {
      for (let c = 0; c < state.grid[r].length; c++) {
        const t = state.grid[r][c]
        if (t && t.level <= 2) lowLevelCells.push([r, c])
      }
    }
    if (lowLevelCells.length === 0) return 0
    const target = lowLevelCells[Math.floor(Math.random() * lowLevelCells.length)]
    const newGrid = state.grid.map(row => row.slice())
    newGrid[target[0]][target[1]] = null
    set({ grid: newGrid })
    return 1
  },

  /**
   * v9.0 刷新网格：保留 Lv.4+ 和觉醒形态，回退其他为空 + spawn 2-3 个 Lv.1
   * - cost: 主动刷新费用（默认 5🪙，死局强救济传 0）
   * - 返回实际清除的 tile 数量
   */
  refreshGrid: (cost = 5) => {
    const state = get()
    if (state.coins < cost) {
      try { (require('@/store/uiStore') as typeof import('@/store/uiStore')).useUiStore.getState().pushToast('🪙 扭蛋币不足，无法刷新', '🪙', 0) } catch {}
      return 0
    }
    // 保留 Lv.4+ 觉醒，其他清空
    const newGrid = state.grid.map(row =>
      row.map(cell => (cell && cell.level >= 4 ? cell : null))
    )
    // spawn 2-3 个 Lv.1
    const empty: Array<[number, number]> = []
    for (let r = 0; r < newGrid.length; r++) {
      for (let c = 0; c < newGrid[r].length; c++) {
        if (!newGrid[r][c]) empty.push([r, c])
      }
    }
    const spawnN = Math.min(empty.length, 2 + Math.floor(Math.random() * 2))  // 2 or 3
    for (let i = 0; i < spawnN; i++) {
      if (empty.length === 0) break
      const idx = Math.floor(Math.random() * empty.length)
      const [r, c] = empty.splice(idx, 1)[0]
      const cap = drawCapsule(state.currentZone, state.pet?.level ?? 0)
      newGrid[r][c] = { id: nextId(), zone: state.currentZone, level: cap.level, bornAt: Date.now() }
    }
    set({ grid: newGrid, coins: state.coins - cost })
    // v9.2 触发 UI 刷新过场
    try { (require('@/store/uiStore') as typeof import('@/store/uiStore')).useUiStore.getState().bumpRefresh() } catch {}
    if (cost > 0) {
      try { (require('@/store/uiStore') as typeof import('@/store/uiStore')).useUiStore.getState().pushToast(`🔄 刷新网格 -${cost}🪙`, '🔄', 0) } catch {}
    } else {
      try { (require('@/store/uiStore') as typeof import('@/store/uiStore')).useUiStore.getState().pushToast('🪦 死局救济：免费刷新网格', '🪦', 1) } catch {}
    }
    return state.grid.flat().filter(t => t && t.level < 4).length
  },

  /**
   * 死局检测：满格 + 4 方向无任何可合成
   * - 同步设置 isDeadlocked
   * - 玩家可在 UI 上一键清 Lv.1-3 兜底
   */
  checkDeadlock: () => {
    const state = get()
    if (!isFull(state.grid)) {
      if (state.isDeadlocked) set({ isDeadlocked: false })
      return false
    }
    const dead = !canAnyMove(state.grid)
    if (dead !== state.isDeadlocked) set({ isDeadlocked: dead })
    return dead
  },

  /**
   * 死局兜底：清 Lv.1-3，保留 Lv.4+，奖励 50 🪙
   * - 返回被清掉的 tile 数
   */
  resolveDeadlock: () => {
    const state = get()
    if (!state.isDeadlocked) return null
    const r = deadlockRelief(state.grid)
    const reward = Math.max(20, r.cleared * 8)
    set({
      grid: r.grid,
      coins: state.coins + reward,
      isDeadlocked: false,
    })
    // 兜底后再 spawn 1 个
    get().trySpawnOne()
    return { cleared: r.cleared, kept: r.kept, reward }
  },

  clearDeadlock: () => set({ isDeadlocked: false }),

  reset: () => {
    set(init())
  },

  save: () => {
    const s = get()
    writeSave({
      coins: s.coins,
      totalPulls: s.totalPulls,
      mergeCount: s.mergeCount,
      combo: s.combo,
      bestCombo: s.bestCombo,
      maxLevel: s.maxLevel,
      zoneMax: s.zoneMax,
      currentZone: s.currentZone,
      grid: s.grid,
      collection: s.collection,
      pet: s.pet,
      petEggStartedAt: s.petEggStartedAt,
      dailyTasks: s.dailyTasks,
      dailyDateKey: s.dailyDateKey,
      checkin: s.checkin,
      challenges: s.challenges,
      challengesDateKey: s.challengesDateKey,
      lastSeenAt: s.lastSeenAt,
      comebackClaimed: s.comebackClaimed,
      history: s.history,
      tutorialStep: s.tutorialStep,
    })
  },

  load: () => {
    set(init())
  },
}))

const computeDominantHue = (collection: Record<ZoneId, number[]>): number => {
  const hueMap: Record<ZoneId, number> = {
    creature: 110, plant: 140, element: 25, culture: 280,
    food: 50, cosmic: 200, music: 330, architecture: 220,
    mythology: 0, dream: 270, retro: 50, ocean: 190,
  }
  let max = 0
  let best: ZoneId = 'creature'
  ;(Object.keys(collection) as ZoneId[]).forEach(z => {
    const n = collection[z].length
    if (n > max) { max = n; best = z }
  })
  return hueMap[best]
}

let saveTimer: number | null = null
export const scheduleSave = () => {
  if (saveTimer) clearTimeout(saveTimer)
  saveTimer = window.setTimeout(() => {
    useGameStore.getState().save()
  }, 2000)
}

if (typeof window !== 'undefined') {
  useGameStore.subscribe(() => scheduleSave())
}
