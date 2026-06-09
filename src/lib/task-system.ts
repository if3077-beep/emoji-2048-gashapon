/**
 * 任务系统 v0.3：每日任务 + 主线任务
 */
import { nextId } from './rng'
import type { ZoneId } from '@/data/emoji-trees'

// ============== 每日任务 ==============

export interface DailyTask {
  id: string
  desc: string
  target: number
  progress: number
  reward: number
  completed: boolean
  claimed: boolean
}

const POOL: Array<Omit<DailyTask, 'id' | 'progress' | 'completed' | 'claimed'>> = [
  { desc: '扭蛋 3 次', target: 3, reward: 5 },
  { desc: '合成 5 次', target: 5, reward: 8 },
  { desc: '达到 Lv.5', target: 5, reward: 10 },
  { desc: '喂养宠物 1 次', target: 1, reward: 6 },
  { desc: '抚摸宠物 3 次', target: 3, reward: 4 },
  { desc: '解锁新图鉴', target: 1, reward: 12 },
  { desc: '切换生态区 2 次', target: 2, reward: 3 },
]

/** 根据日期 + 玩家 ID 选 3 个任务（同一天稳定） */
export const generateDailyTasks = (dateKey: string, _uid = 'default'): DailyTask[] => {
  const seed = hashCode(dateKey + _uid)
  const shuffled = [...POOL].sort((a, b) => pseudoRandom(seed + a.desc.length) - pseudoRandom(seed + b.desc.length))
  return shuffled.slice(0, 3).map(t => ({
    ...t,
    id: nextId('task'),
    progress: 0,
    completed: false,
    claimed: false,
  }))
}

const hashCode = (s: string): number => {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h << 5) - h + s.charCodeAt(i)
  return Math.abs(h)
}

const pseudoRandom = (n: number): number => {
  const x = Math.sin(n) * 10000
  return x - Math.floor(x)
}

/** 更新每日任务进度（事件驱动） */
export const updateTaskProgress = (
  tasks: DailyTask[],
  predicate: (t: DailyTask) => boolean,
  delta = 1,
): { tasks: DailyTask[]; newlyCompleted: DailyTask[] } => {
  const newly: DailyTask[] = []
  const next = tasks.map(t => {
    if (t.completed || !predicate(t)) return t
    const p = Math.min(t.target, t.progress + delta)
    if (p >= t.target && !t.completed) {
      const done = { ...t, progress: p, completed: true }
      newly.push(done)
      return done
    }
    return { ...t, progress: p }
  })
  return { tasks: next, newlyCompleted: newly }
}

// ============== 主线任务 v0.3 ==============

/**
 * 主线任务：通关 1 区解锁 1 新区，跨 12 主题的爬塔
 * - 玩家完成当前任务才能解锁下一个
 * - 完成最后 1 个任务 → "终章"
 */
export interface MainTask {
  id: string
  chapter: number
  title: string
  desc: string
  /** 任务类型 */
  type: 'reach_level' | 'collect_zone' | 'unlock_zones'
  /** 目标值（reach_level=等级, collect_zone=集齐一区等级数, unlock_zones=解锁主题数） */
  target: number
  /** 解锁哪个新区（完成后才能玩该主题） */
  unlockZone?: ZoneId
  reward: number
  intensity: 0 | 1 | 2 | 3
}

export const MAIN_TASKS: MainTask[] = [
  { id: 'mt_1',  chapter: 1,  title: '初识生物',     desc: '生物圈合成到 Lv.5',           type: 'reach_level', target: 5,  reward: 30,   intensity: 1 },
  { id: 'mt_2',  chapter: 2,  title: '解锁植物界',   desc: '生物圈集齐 11 个等级',         type: 'collect_zone', target: 11, reward: 100,  intensity: 2, unlockZone: 'plant' },
  { id: 'mt_3',  chapter: 3,  title: '火与水',       desc: '解锁 2 个新区',               type: 'unlock_zones', target: 2, reward: 80,   intensity: 1 },
  { id: 'mt_4',  chapter: 4,  title: '集齐人文',     desc: '任意一区集齐 11 个等级',       type: 'collect_zone', target: 11, reward: 200,  intensity: 2 },
  { id: 'mt_5',  chapter: 5,  title: '厨神之路',     desc: '解锁 4 个新区',               type: 'unlock_zones', target: 4, reward: 150,  intensity: 1, unlockZone: 'food' },
  { id: 'mt_6',  chapter: 6,  title: '登月之旅',     desc: '合成到 Lv.8',                type: 'reach_level', target: 8,  reward: 400,  intensity: 2 },
  { id: 'mt_7',  chapter: 7,  title: '银河之心',     desc: '解锁 6 个新区',               type: 'unlock_zones', target: 6, reward: 350,  intensity: 2, unlockZone: 'cosmic' },
  { id: 'mt_8',  chapter: 8,  title: '旋律交响',     desc: '解锁 8 个新区',               type: 'unlock_zones', target: 8, reward: 600,  intensity: 2, unlockZone: 'music' },
  { id: 'mt_9',  chapter: 9,  title: '第一阶觉醒',   desc: '任意一区合成到 Lv.11',         type: 'reach_level', target: 11, reward: 1500, intensity: 3 },
  { id: 'mt_10', chapter: 10, title: '通晓建筑',     desc: '解锁 10 个新区',              type: 'unlock_zones', target: 10, reward: 2000, intensity: 3, unlockZone: 'architecture' },
  { id: 'mt_11', chapter: 11, title: '造梦者',       desc: '解锁 12 个新区',              type: 'unlock_zones', target: 12, reward: 5000, intensity: 3, unlockZone: 'dream' },
  { id: 'mt_12', chapter: 12, title: '终章·合众之神', desc: '全部主题觉醒 1 阶',          type: 'reach_level', target: 12, reward: 20000, intensity: 3 },
]

/**
 * 检查主线任务的当前进度
 */
export const computeMainTaskProgress = (
  task: MainTask,
  ctx: { maxLevel: number; zoneMax: Record<ZoneId, number>; unlockedZones: number; maxZoneMax: number },
): { progress: number; done: boolean } => {
  let p = 0
  switch (task.type) {
    case 'reach_level':
      p = ctx.maxLevel
      break
    case 'collect_zone':
      p = ctx.maxZoneMax  // 任意一区最高等级（用作"已集齐该区"的代理）
      break
    case 'unlock_zones':
      p = ctx.unlockedZones
      break
  }
  return { progress: Math.min(p, task.target), done: p >= task.target }
}

/** 主线任务状态（持久化） */
export interface MainTaskState {
  /** 当前进行中的章节（0-indexed） */
  currentChapter: number
  /** 已领取的章节 ID 列表 */
  claimed: string[]
}

export const initialMainTaskState = (): MainTaskState => ({
  currentChapter: 0,
  claimed: [],
})

/** 推进主线 */
export const advanceMainTask = (
  state: MainTaskState,
  taskId: string,
): MainTaskState => {
  if (state.claimed.includes(taskId)) return state
  return {
    currentChapter: Math.min(state.currentChapter + 1, MAIN_TASKS.length - 1),
    claimed: [...state.claimed, taskId],
  }
}
