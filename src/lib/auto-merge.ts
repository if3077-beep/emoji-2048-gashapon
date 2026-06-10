/**
 * v0.7 一键合并引擎
 * - 反复调用 slide 直到没有可合并
 * - 找到最容易合并的方向（最多合并事件的方向）
 * - 收集所有事件，应用奖励
 */
import { slide as slideGrid, type Grid, type SlideResult, type MergeEvent } from '@/lib/merge-engine'
import type { ZoneId } from '@/data/emoji-trees'
import { GRID_SIZE } from '@/data/emoji-trees'

type Dir = 'up' | 'down' | 'left' | 'right'

export interface AutoMergeResult {
  finalGrid: Grid
  totalEvents: MergeEvent[]
  totalMoves: number
  rounds: number
}

/** 找当前网格"最优滑动方向"（产生最多合并事件的方向） */
const findBestDir = (grid: Grid): Dir => {
  const dirs: Dir[] = ['up', 'down', 'left', 'right']
  let best: { dir: Dir; count: number } = { dir: 'down', count: -1 }
  for (const d of dirs) {
    const r = slideGrid(grid, d)
    if (r.events.length > best.count) {
      best = { dir: d, count: r.events.length }
    }
  }
  return best.dir
}

/** 检测 3 连锁动：3+ 个同色同级排成一条线（横/竖/对角） */
export const detectMatch3 = (grid: Grid): Array<[number, number][]> => {
  const matches: Array<[number, number][]> = []
  // 行
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c <= GRID_SIZE - 3; c++) {
      const a = grid[r]?.[c], b = grid[r]?.[c + 1], c2 = grid[r]?.[c + 2]
      if (a && b && c2 && a.zone === b.zone && a.zone === c2.zone && a.level === b.level && a.level === c2.level) {
        matches.push([[r, c], [r, c + 1], [r, c + 2]])
      }
    }
  }
  // 列
  for (let c = 0; c < GRID_SIZE; c++) {
    for (let r = 0; r <= GRID_SIZE - 3; r++) {
      const a = grid[r]?.[c], b = grid[r + 1]?.[c], c2 = grid[r + 2]?.[c]
      if (a && b && c2 && a.zone === b.zone && a.zone === c2.zone && a.level === b.level && a.level === c2.level) {
        matches.push([[r, c], [r + 1, c], [r + 2, c]])
      }
    }
  }
  return matches
}

/** 一键合并：贪心反复找最优方向滑动，直到无事件 */
export const autoMerge = (grid: Grid, maxRounds = 6): AutoMergeResult => {
  let g = grid
  let totalEvents: MergeEvent[] = []
  let totalMoves = 0
  let rounds = 0
  for (let i = 0; i < maxRounds; i++) {
    const dir = findBestDir(g)
    const r: SlideResult = slideGrid(g, dir)
    if (r.events.length === 0) break
    totalEvents = totalEvents.concat(r.events)
    totalMoves += r.moves.length
    g = r.grid
    rounds++
  }
  return { finalGrid: g, totalEvents, totalMoves, rounds }
}
