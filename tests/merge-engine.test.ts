/**
 * merge-engine 单元测试
 */
import { describe, it, expect, beforeEach } from 'vitest'
import {
  emptyGrid,
  cloneGrid,
  findEmptyCells,
  isFull,
  placeCapsule,
  dragMerge,
  findMaxLevel,
  findZoneMax,
  levelToTier,
  type Grid,
} from '../src/lib/merge-engine'
import { setRng } from '../src/lib/rng'
import type { ZoneId } from '../src/data/emoji-trees'

const makeTile = (level: number, zone: ZoneId = 'creature', id?: string) => ({
  id: id ?? `t_${level}_${Math.random().toString(36).slice(2)}`,
  zone,
  level,
  bornAt: 0,
})

describe('merge-engine', () => {
  beforeEach(() => {
    setRng(Math.random)
  })

  describe('emptyGrid / cloneGrid', () => {
    it('emptyGrid returns 4x4 null grid', () => {
      const g = emptyGrid()
      expect(g.length).toBe(4)
      expect(g[0]!.length).toBe(4)
      expect(g.flat().every(c => c === null)).toBe(true)
    })
    it('cloneGrid returns independent copy', () => {
      const g = emptyGrid()
      g[0]![0] = makeTile(1)
      const c = cloneGrid(g)
      c[0]![0]!.level = 99
      expect(g[0]![0]!.level).toBe(1)
    })
  })

  describe('findEmptyCells / isFull', () => {
    it('findEmptyCells returns all positions for empty grid', () => {
      expect(findEmptyCells(emptyGrid()).length).toBe(16)
    })
    it('isFull true when no empties', () => {
      const g: Grid = Array.from({ length: 4 }, () => Array(4).fill(makeTile(1)))
      expect(isFull(g)).toBe(true)
    })
  })

  describe('placeCapsule', () => {
    it('places in first empty cell when no merge', () => {
      setRng(() => 0.5)  // 让 Lv1 落点确定
      const g = emptyGrid()
      const r = placeCapsule(g, makeTile(1))
      expect(r.merged).toBe(false)
      const empties = findEmptyCells(r.grid).length
      expect(empties).toBe(15)
    })

    it('auto-merges when same level+zone exists', () => {
      const g = emptyGrid()
      g[0]![0] = makeTile(2, 'creature')
      const r = placeCapsule(g, makeTile(2, 'creature'))
      expect(r.merged).toBe(true)
      expect(r.mergedAt).toEqual([0, 0])
      expect(r.grid[0]![0]!.level).toBe(3)
    })

    it('does not merge across zones', () => {
      const g = emptyGrid()
      g[0]![0] = makeTile(2, 'creature')
      const r = placeCapsule(g, makeTile(2, 'plant'))
      expect(r.merged).toBe(false)
    })

    it('replaces lowest level when grid is full', () => {
      // 用 Lv5 避免自动合并（其他格子都是 Lv1-4）
      const g: Grid = Array.from({ length: 4 }, (_, r) =>
        Array.from({ length: 4 }, (_, c) => makeTile(r + 1, 'creature', `t_${r}_${c}`)),
      )
      const r = placeCapsule(g, makeTile(5, 'creature'))
      expect(r.merged).toBe(false)
      // 替换最低级 Lv1 中的一个，新 Lv5 进入
      expect(r.grid.flat().some(t => t!.level === 5)).toBe(true)
      // Lv1 还剩 3 个（4 个被替换 1 个）
      expect(r.grid.flat().filter(t => t!.level === 1).length).toBe(3)
    })
  })

  describe('dragMerge', () => {
    it('merges same level+zone to next level', () => {
      const g = emptyGrid()
      g[0]![0] = makeTile(3, 'creature')
      g[0]![1] = makeTile(3, 'creature')
      const r = dragMerge(g, [0, 0], [0, 1])
      expect(r.success).toBe(true)
      expect(r.newLevel).toBe(4)
      expect(r.grid[0]![0]).toBeNull()
      expect(r.grid[0]![1]!.level).toBe(4)
    })

    it('rejects different zones', () => {
      const g = emptyGrid()
      g[0]![0] = makeTile(3, 'creature')
      g[0]![1] = makeTile(3, 'plant')
      const r = dragMerge(g, [0, 0], [0, 1])
      expect(r.success).toBe(false)
    })

    it('rejects different levels', () => {
      const g = emptyGrid()
      g[0]![0] = makeTile(3, 'creature')
      g[0]![1] = makeTile(2, 'creature')
      const r = dragMerge(g, [0, 0], [0, 1])
      expect(r.success).toBe(false)
    })

    it('caps at base MAX_LEVEL (11) - drag does not enter awakening', () => {
      // dragMerge 是 v0.1 兼容接口，仅处理基础链 1-11
      // 觉醒循环（>11）请用 slide()
      const g = emptyGrid()
      g[0]![0] = makeTile(11, 'creature')
      g[0]![1] = makeTile(11, 'creature')
      const r = dragMerge(g, [0, 0], [0, 1])
      expect(r.success).toBe(false)
    })

    it('rejects same cell', () => {
      const g = emptyGrid()
      g[0]![0] = makeTile(3, 'creature')
      const r = dragMerge(g, [0, 0], [0, 0])
      expect(r.success).toBe(false)
    })

    it('rejects empty cell', () => {
      const g = emptyGrid()
      g[0]![0] = makeTile(3, 'creature')
      const r = dragMerge(g, [0, 0], [1, 1])
      expect(r.success).toBe(false)
    })
  })

  describe('findMaxLevel / findZoneMax', () => {
    it('returns 0 for empty grid', () => {
      expect(findMaxLevel(emptyGrid())).toBe(0)
      expect(findZoneMax(emptyGrid())).toEqual({
        creature: 0, plant: 0, element: 0, culture: 0,
        food: 0, cosmic: 0, music: 0, architecture: 0,
        mythology: 0, dream: 0, retro: 0, ocean: 0,
      })
    })

    it('finds max across zones', () => {
      const g = emptyGrid()
      g[0]![0] = makeTile(5, 'creature')
      g[1]![0] = makeTile(8, 'plant')
      g[2]![0] = makeTile(3, 'element')
      expect(findMaxLevel(g)).toBe(8)
      const z = findZoneMax(g)
      expect(z.creature).toBe(5)
      expect(z.plant).toBe(8)
      expect(z.element).toBe(3)
      expect(z.culture).toBe(0)
    })
  })

  describe('levelToTier', () => {
    it('returns 0 for Lv 1-3', () => {
      expect(levelToTier(1)).toBe(0)
      expect(levelToTier(3)).toBe(0)
    })
    it('returns 1 for Lv 4-6', () => {
      expect(levelToTier(4)).toBe(1)
      expect(levelToTier(6)).toBe(1)
    })
    it('returns 2 for Lv 7-9', () => {
      expect(levelToTier(7)).toBe(2)
      expect(levelToTier(9)).toBe(2)
    })
    it('returns 3 for Lv 10-11', () => {
      expect(levelToTier(10)).toBe(3)
      expect(levelToTier(11)).toBe(3)
    })
  })
})
