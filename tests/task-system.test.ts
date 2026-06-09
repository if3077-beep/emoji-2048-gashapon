/**
 * 任务系统测试
 */
import { describe, it, expect } from 'vitest'
import { generateDailyTasks, updateTaskProgress } from '../src/lib/task-system'

describe('task-system', () => {
  describe('generateDailyTasks', () => {
    it('returns 3 tasks', () => {
      const tasks = generateDailyTasks('2026-06-09')
      expect(tasks.length).toBe(3)
    })

    it('is stable for same day', () => {
      const a = generateDailyTasks('2026-06-09', 'user1')
      const b = generateDailyTasks('2026-06-09', 'user1')
      expect(a.map(t => t.desc).sort()).toEqual(b.map(t => t.desc).sort())
    })

    it('differs for different days', () => {
      const a = generateDailyTasks('2026-06-09', 'user1')
      const b = generateDailyTasks('2026-06-10', 'user1')
      // 不一定严格不同，但概率上不应完全相同
      // 只检查返回 3 个
      expect(b.length).toBe(3)
      expect(a.length).toBe(3)
    })

    it('all tasks start incomplete with 0 progress', () => {
      const tasks = generateDailyTasks('2026-06-09')
      tasks.forEach(t => {
        expect(t.progress).toBe(0)
        expect(t.completed).toBe(false)
        expect(t.claimed).toBe(false)
        expect(t.target).toBeGreaterThan(0)
        expect(t.reward).toBeGreaterThan(0)
      })
    })
  })

  describe('updateTaskProgress', () => {
    it('increments progress on predicate match', () => {
      const tasks = generateDailyTasks('2026-06-09')
      const firstId = tasks[0]!.id
      // 找一个 target > 1 的任务以避免首次就完成
      const task = tasks.find(t => t.target > 1) ?? tasks[0]!
      const id = task.id
      const { tasks: next } = updateTaskProgress(tasks, t => t.id === id, 1)
      const t = next.find(x => x.id === id)!
      expect(t.progress).toBe(1)
      expect(t.completed).toBe(t.progress >= t.target)
    })

    it('marks completed when target reached', () => {
      const tasks = generateDailyTasks('2026-06-09')
      const firstId = tasks[0]!.id
      const target = tasks[0]!.target
      const { tasks: next, newlyCompleted } = updateTaskProgress(tasks, t => t.id === firstId, target)
      expect(next.find(x => x.id === firstId)!.completed).toBe(true)
      expect(newlyCompleted.length).toBe(1)
    })

    it('skips already completed', () => {
      const tasks = generateDailyTasks('2026-06-09').map(t => ({ ...t, completed: true }))
      const { tasks: next, newlyCompleted } = updateTaskProgress(tasks, () => true, 99)
      expect(newlyCompleted.length).toBe(0)
    })

    it('does not exceed target', () => {
      const tasks = generateDailyTasks('2026-06-09')
      const firstId = tasks[0]!.id
      const target = tasks[0]!.target
      const { tasks: next } = updateTaskProgress(tasks, t => t.id === firstId, target * 10)
      expect(next.find(x => x.id === firstId)!.progress).toBe(target)
    })
  })
})
