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

/** v2.1 消消乐强化：检测最长 3+ 连锁长度
 * - 返回：longest (>=3) 和 groups (所有 3+ 连锁组)
 * - 同时支持横/竖扫描扩展到 4、5+ 连锁
 */
export interface MatchGroup {
  cells: Array<[number, number]>
  length: number
  zone: string
  level: number
}

export const findLongestMatch = (grid: Grid): { longest: number; groups: MatchGroup[] } => {
  const groups: MatchGroup[] = []
  const sameKey = (a: any, b: any) => a && b && a.zone === b.zone && a.level === b.level

  // 行扫描
  for (let r = 0; r < GRID_SIZE; r++) {
    let c = 0
    while (c < GRID_SIZE) {
      const head = grid[r]?.[c]
      if (!head) { c++; continue }
      let end = c + 1
      while (end < GRID_SIZE && sameKey(head, grid[r]?.[end])) end++
      const len = end - c
      if (len >= 3) {
        const cells: Array<[number, number]> = []
        for (let k = c; k < end; k++) cells.push([r, k])
        groups.push({ cells, length: len, zone: head.zone, level: head.level })
      }
      c = end
    }
  }
  // 列扫描
  for (let c = 0; c < GRID_SIZE; c++) {
    let r = 0
    while (r < GRID_SIZE) {
      const head = grid[r]?.[c]
      if (!head) { r++; continue }
      let end = r + 1
      while (end < GRID_SIZE && sameKey(head, grid[end]?.[c])) end++
      const len = end - r
      if (len >= 3) {
        const cells: Array<[number, number]> = []
        for (let k = r; k < end; k++) cells.push([k, c])
        groups.push({ cells, length: len, zone: head.zone, level: head.level })
      }
      r = end
    }
  }

  const longest = groups.reduce((m, g) => Math.max(m, g.length), 0)
  return { longest, groups }
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
