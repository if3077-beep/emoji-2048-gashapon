/**
 * 核心合成引擎（v0.2：支持觉醒、滑动）
 * - placeCapsule: 投放胶囊
 * - slide: 滑动整行/列 → 推动 → 合并 → 事件流
 * - dragMerge: 保留兼容（拖拽单格，v0.1 留的接口）
 */
import type { ZoneId } from '@/data/emoji-trees'
import { ZONES, GRID_SIZE, MAX_LEVEL, ZONE_LIST } from '@/data/emoji-trees'
import { rng, nextId } from './rng'
import type { EventKind } from './event-rewards'

export interface Tile {
  id: string
  zone: ZoneId
  level: number
  bornAt: number
}

export type Grid = (Tile | null)[][]

export const emptyGrid = (): Grid =>
  Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(null))

export const cloneGrid = (g: Grid): Grid =>
  g.map(row => row.map(cell => (cell ? { ...cell } : null)))

export const findEmptyCells = (g: Grid): Array<[number, number]> => {
  const out: Array<[number, number]> = []
  for (let r = 0; r < GRID_SIZE; r++)
    for (let c = 0; c < GRID_SIZE; c++) if (!g[r][c]) out.push([r, c])
  return out
}

export const isFull = (g: Grid): boolean => findEmptyCells(g).length === 0

export const drawCapsule = (zone: ZoneId, petLevelBoost = 0): Tile => {
  const r = rng()
  let level = 1
  const boost = Math.min(petLevelBoost * 0.03, 0.15)
  if (r < 0.05 + boost) level = 3
  else if (r < 0.3 + boost) level = 2
  return { id: nextId('tile'), zone, level, bornAt: Date.now() }
}

export const placeCapsule = (
  grid: Grid,
  cap: Tile,
): { grid: Grid; merged: boolean; mergedAt?: [number, number] } => {
  const g = cloneGrid(grid)
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      const t = g[r]![c]
      if (t && t.zone === cap.zone && t.level === cap.level) {
        t.level += 1
        t.bornAt = Date.now()
        return { grid: g, merged: true, mergedAt: [r, c] }
      }
    }
  }
  const empty = findEmptyCells(g)
  if (empty.length) {
    const [r, c] = empty[Math.floor(rng() * empty.length)]!
    g[r]![c] = cap
    return { grid: g, merged: false }
  }
  let minLevel = Infinity
  let minPos: [number, number] = [0, 0]
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      const t = g[r]![c]!
      if (t.level < minLevel) {
        minLevel = t.level
        minPos = [r, c]
      }
    }
  }
  g[minPos[0]]![minPos[1]] = cap
  return { grid: g, merged: false }
}

export const dragMerge = (
  grid: Grid,
  from: [number, number],
  to: [number, number],
): { grid: Grid; success: boolean; newLevel: number; zone: ZoneId; pos: [number, number] } => {
  const [fr, fc] = from
  const [tr, tc] = to
  if (fr === tr && fc === tc) return { grid, success: false, newLevel: 0, zone: 'creature', pos: to }
  const a = grid[fr]?.[fc]
  const b = grid[tr]?.[tc]
  if (!a || !b) return { grid, success: false, newLevel: 0, zone: a?.zone ?? b?.zone ?? 'creature', pos: to }
  if (a.zone !== b.zone || a.level !== b.level) return { grid, success: false, newLevel: 0, zone: a.zone, pos: to }
  // v0.1 兼容接口：拖拽不进入觉醒循环
  if (a.level >= MAX_LEVEL) return { grid, success: false, newLevel: 0, zone: a.zone, pos: to }
  const g = cloneGrid(grid)
  g[tr]![tc] = { id: nextId('tile'), zone: a.zone, level: a.level + 1, bornAt: Date.now() }
  g[fr]![fc] = null
  return { grid: g, success: true, newLevel: a.level + 1, zone: a.zone, pos: to }
}

export type Collection = Record<ZoneId, Set<number>>

export const emptyCollection = (): Collection => {
  const out = {} as Collection
  ZONE_LIST.forEach(z => { out[z.id] = new Set() })
  return out
}

export const findMaxLevel = (g: Grid): number => {
  let m = 0
  for (let r = 0; r < GRID_SIZE; r++)
    for (let c = 0; c < GRID_SIZE; c++) {
      const t = g[r]?.[c]
      if (t && t.level > m) m = t.level
    }
  return m
}

export const findZoneMax = (g: Grid): Record<ZoneId, number> => {
  const out = {} as Record<ZoneId, number>
  ZONE_LIST.forEach(z => { out[z.id] = 0 })
  for (let r = 0; r < GRID_SIZE; r++)
    for (let c = 0; c < GRID_SIZE; c++) {
      const t = g[r]?.[c]
      if (t && t.level > out[t.zone]) out[t.zone] = t.level
    }
  return out
}

export const levelToTier = (level: number): 0 | 1 | 2 | 3 => {
  if (level <= 3) return 0
  if (level <= 6) return 1
  if (level <= 9) return 2
  return 3
}

// ============================================================
// v0.2：滑动合并（核心）
// ============================================================

export interface MoveRecord {
  tileId: string
  from: [number, number]
  to: [number, number]
}

export interface MergeEvent {
  kind: EventKind
  pos: [number, number]
  level: number
  zone: ZoneId
  isFirstTime: boolean
}

export interface SlideResult {
  grid: Grid
  moves: MoveRecord[]
  events: MergeEvent[]
  moved: boolean
}

type Dir = 'up' | 'down' | 'left' | 'right'

/**
 * 滑动一行/列：
 * 1) 压向 dir 一侧（保序：行/列的相对顺序不变）
 * 2) 沿 dir 方向扫描合并（同类同级 → 远端+1）
 */
export const slide = (grid: Grid, dir: Dir, collection?: Record<ZoneId, number[]>): SlideResult => {
  const g = cloneGrid(grid)
  const moves: MoveRecord[] = []
  const events: MergeEvent[] = []

  // === 1. 压紧 ===
  for (let i = 0; i < GRID_SIZE; i++) {
    const tiles: Tile[] = []
    let positions: Array<[number, number]> = []
    if (dir === 'up' || dir === 'down') {
      for (let r = 0; r < GRID_SIZE; r++) {
        const t = g[r]![i]
        if (t) {
          tiles.push(t)
          positions.push([r, i])
        }
      }
      const newPositions: Array<[number, number]> = []
      for (let k = 0; k < tiles.length; k++) {
        const newR = dir === 'up' ? k : GRID_SIZE - 1 - (tiles.length - 1 - k)
        newPositions.push([newR, i])
      }
      // 清空
      for (let r = 0; r < GRID_SIZE; r++) g[r]![i] = null
      // 写回
      for (let k = 0; k < tiles.length; k++) {
        const [nr, nc] = newPositions[k]!
        const [or, oc] = positions[k]!
        g[nr]![nc] = tiles[k]!
        if (nr !== or || nc !== oc) {
          moves.push({ tileId: tiles[k]!.id, from: [or, oc], to: [nr, nc] })
        }
      }
    } else {
      for (let c = 0; c < GRID_SIZE; c++) {
        const t = g[i]![c]
        if (t) {
          tiles.push(t)
          positions.push([i, c])
        }
      }
      const newPositions: Array<[number, number]> = []
      for (let k = 0; k < tiles.length; k++) {
        const newC = dir === 'left' ? k : GRID_SIZE - 1 - (tiles.length - 1 - k)
        newPositions.push([i, newC])
      }
      for (let c = 0; c < GRID_SIZE; c++) g[i]![c] = null
      for (let k = 0; k < tiles.length; k++) {
        const [nr, nc] = newPositions[k]!
        const [or, oc] = positions[k]!
        g[nr]![nc] = tiles[k]!
        if (nr !== or || nc !== oc) {
          moves.push({ tileId: tiles[k]!.id, from: [or, oc], to: [nr, nc] })
        }
      }
    }
  }

  // === 2. 合并扫描 ===
  // 沿 dir 方向，从"远端"开始比较相邻两格
  // up:    从 r=0 出发，找 r 和 r+1；r+1 合并到 r
  // down:  从 r=GRID-1 出发，找 r 和 r-1；r-1 合并到 r
  // left:  从 c=0 出发，找 c 和 c+1；c+1 合并到 c
  // right: 从 c=GRID-1 出发，找 c 和 c-1；c-1 合并到 c
  const rangeR = (): Array<number> => {
    if (dir === 'up') return Array.from({ length: GRID_SIZE }, (_, i) => i)
    if (dir === 'down') return Array.from({ length: GRID_SIZE }, (_, i) => GRID_SIZE - 1 - i)
    return Array.from({ length: GRID_SIZE }, (_, i) => i)
  }
  const rangeC = (): Array<number> => {
    if (dir === 'left') return Array.from({ length: GRID_SIZE }, (_, i) => i)
    if (dir === 'right') return Array.from({ length: GRID_SIZE }, (_, i) => GRID_SIZE - 1 - i)
    return Array.from({ length: GRID_SIZE }, (_, i) => i)
  }
  const isVertical = dir === 'up' || dir === 'down'

  for (let pass = 0; pass < GRID_SIZE; pass++) {
    const rIter = rangeR()
    const cIter = rangeC()
    for (const r of rIter) {
      for (const c of cIter) {
        const t = g[r]![c]
        if (!t) continue
        // 找 dir 方向的邻居（在前面被合并过的不算）
        let nr = r, nc = c
        if (isVertical) {
          if (dir === 'up') nr = r - 1
          else nr = r + 1
        } else {
          if (dir === 'left') nc = c - 1
          else nc = c + 1
        }
        if (nr < 0 || nr >= GRID_SIZE || nc < 0 || nc >= GRID_SIZE) continue
        const o = g[nr]![nc]
        if (o && o.zone === t.zone && o.level === t.level) {
          // 合并：t（远端）+1，o（近端）消失
          t.level += 1
          t.bornAt = Date.now()
          g[nr]![nc] = null
          moves.push({ tileId: o.id, from: [nr, nc], to: [r, c] })
          const isFirstTime = collection ? !collection[t.zone].includes(t.level) : false
          events.push({
            kind: pickEventKind(t.level, isFirstTime),
            pos: [r, c],
            level: t.level,
            zone: t.zone,
            isFirstTime,
          })
        }
      }
    }
  }

  return { grid: g, moves, events, moved: moves.length > 0 }
}

const pickEventKind = (level: number, isFirstTime: boolean): EventKind => {
  if (level === 21) return 'merge_awaken_t10'
  if (level === 16) return 'merge_awaken_t5'
  if (level === 12) return 'merge_awaken'
  if (level >= 10) return 'merge_mythic'
  if (level >= 8) return 'merge_epic'
  if (level >= 5) return 'merge_rare'
  if (isFirstTime) return 'merge_first'
  return 'merge_basic'
}
