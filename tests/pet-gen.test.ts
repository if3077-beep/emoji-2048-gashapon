/**
 * 宠物生成器测试
 */
import { describe, it, expect, beforeEach } from 'vitest'
import { setRng } from '../src/lib/rng'
import { generatePet, feedPet, petPet, personalityBehavior } from '../src/lib/pet-gen'

describe('pet-gen', () => {
  beforeEach(() => {
    setRng(Math.random)
  })

  describe('generatePet', () => {
    it('produces a valid pet with required fields', () => {
      const p = generatePet()
      expect(p.id).toBeTruthy()
      expect(p.name.length).toBe(2)
      expect(p.level).toBe(1)
      expect(p.affection).toBe(0)
      expect(p.hue).toBeGreaterThanOrEqual(0)
      expect(p.hue).toBeLessThan(360)
      expect(['mini', 'normal', 'stout', 'giant', 'mythic']).toContain(p.size)
      expect(['clingy', 'independent', 'curious', 'glutton', 'proud']).toContain(p.personality)
    })

    it('respects dominant hue (within 30 deg)', () => {
      // 强制 rng 一直返回 < 0.5 让它使用 dominantHue
      setRng(() => 0.2)
      const p = generatePet({ dominantHue: 200 })
      const diff = Math.abs(p.hue - 200)
      const wrapped = Math.min(diff, 360 - diff)
      expect(wrapped).toBeLessThanOrEqual(30)
    })

    it('mythic size is rare', () => {
      let mythicCount = 0
      const N = 200
      for (let i = 0; i < N; i++) {
        if (generatePet().size === 'mythic') mythicCount++
      }
      // 3% 期望 → 期望 6 个
      expect(mythicCount).toBeLessThan(20)
    })
  })

  describe('feedPet', () => {
    it('adds affection', () => {
      const p = { ...generatePet(), lastFedAt: 0 }
      const { pet: p2 } = feedPet(p)
      expect(p2.affection).toBeGreaterThan(p.affection)
    })

    it('cooldown prevents rapid re-feed', () => {
      const p = { ...generatePet(), lastFedAt: Date.now() }
      const result = feedPet(p)
      expect(result.evolved).toBe(false)
      // affection 不会涨（因为 cooldown）
      expect(result.pet.affection).toBe(p.affection)
    })

    it('caps affection at 100', () => {
      const p = { ...generatePet(), affection: 99, lastFedAt: 0 }
      const { pet: p2 } = feedPet(p)
      expect(p2.affection).toBeLessThanOrEqual(100)
    })
  })

  describe('petPet', () => {
    it('adds 3 affection', () => {
      const p = generatePet()
      const r = petPet(p)
      expect(r.ready).toBe(true)
      expect(r.pet.affection - p.affection).toBe(3)
    })
  })

  describe('personalityBehavior', () => {
    it('returns valid behavior for all personalities', () => {
      ;['clingy', 'independent', 'curious', 'glutton', 'proud'].forEach(p => {
        const b = personalityBehavior(p as any)
        expect(b.lag).toBeGreaterThan(0)
        expect(b.idleYawn).toBeGreaterThan(0)
        expect(b.idleWander).toBeGreaterThan(0)
        expect(b.jumpFreq).toBeGreaterThan(0)
      })
    })

    it('clingy has shorter lag than independent', () => {
      const c = personalityBehavior('clingy')
      const i = personalityBehavior('independent')
      expect(c.lag).toBeLessThan(i.lag)
    })
  })
})
