/**
 * 游戏主状态（v0.2：事件奖励 + 滑动 + 觉醒）
 */
import { create } from 'zustand'
import type { ZoneId } from '@/data/emoji-trees'
import { ZONES, MAX_LEVEL, GRID_SIZE, ZONE_LIST } from '@/data/emoji-trees'
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
} from '@/lib/merge-engine'
import { generatePet, feedPet, petPet, computeForm, type Pet, type PetForm } from '@/lib/pet-gen'
import { generateDailyTasks, updateTaskProgress, type DailyTask } from '@/lib/task-system'
import { loadSave, writeSave } from '@/lib/persistence'
import { nextId } from '@/lib/rng'
import { calcReward, getReward, type EventKind } from '@/lib/event-rewards'
import { computeBuff, rollCrit } from '@/lib/season'

interface GameState {
  // 基础
  coins: number
  totalPulls: number
  mergeCount: number
  combo: number
  bestCombo: number
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

  // 教程
  tutorialStep: number

  // 操作
  pull: (multi?: number) => void
  slide: (dir: 'up' | 'down' | 'left' | 'right') => SlideResult
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
      maxLevel: saved.maxLevel ?? 0,
      zoneMax: saved.zoneMax ?? defaultZoneMax(),
      currentZone: saved.currentZone ?? ('creature' as ZoneId),
      grid: saved.grid ?? emptyGrid(),
      collection: saved.collection ?? defaultCollection(),
      pet: saved.pet ?? null,
      petEggStartedAt: saved.petEggStartedAt ?? null,
      dailyTasks: saved.dailyDateKey === todayKey() ? (saved.dailyTasks ?? []) : generateDailyTasks(todayKey()),
      dailyDateKey: saved.dailyDateKey ?? todayKey(),
      tutorialStep: saved.tutorialStep ?? 1,
    }
  }
  return {
    coins: 10,
    totalPulls: 0,
    mergeCount: 0,
    combo: 0,
    bestCombo: 0,
    maxLevel: 0,
    zoneMax: defaultZoneMax(),
    currentZone: 'creature' as ZoneId,
    grid: emptyGrid(),
    collection: defaultCollection(),
    pet: null,
    petEggStartedAt: null,
    dailyTasks: generateDailyTasks(todayKey()),
    dailyDateKey: todayKey(),
    tutorialStep: 1,
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
          if (t.level === 10 && !state.pet && newPetEggStarted === null) {
            newPetEggStarted = Date.now()
          }
          if (t.level === 11 && !state.pet && newPetEggStarted !== null) {
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
  },

  slide: (dir) => {
    const state = get()
    const result = slideGrid(state.grid, dir, state.collection)
    if (!result.moved) {
      // 滑动无效 → 断连击
      if (state.combo > 0) set({ combo: 0 })
      return result
    }

    let { coins, combo, bestCombo, mergeCount, maxLevel, zoneMax, collection } = state
    combo++
    if (combo > bestCombo) bestCombo = combo

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

    // 宠物触发：Lv.10 → 蛋；Lv.11 → 孵化
    let newPetEggStarted = state.petEggStartedAt
    let newlyHatched: Pet | null = null
    for (const evt of result.events) {
      if (evt.level === 10 && !state.pet && newPetEggStarted === null) {
        newPetEggStarted = Date.now()
      }
      if (evt.level === 11 && !state.pet && newPetEggStarted !== null) {
        newlyHatched = generatePet({ triggerLevel: evt.level })
        coins += 100
      }
    }

    const updates: any = {
      grid: result.grid,
      coins,
      combo,
      bestCombo,
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
  },

  spendCoins: (n) => {
    const { coins } = get()
    if (coins < n) return false
    set({ coins: coins - n })
    return true
  },

  addCoins: (n) => set(s => ({ coins: s.coins + n })),

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
