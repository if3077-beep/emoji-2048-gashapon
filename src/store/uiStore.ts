/**
 * UI 状态（v0.2：增加 CoinBurst，v0.4：增加签到/统计/分享/装扮/成就弹层）
 */
import { create } from 'zustand'
import type { CoinBurst } from '@/components/ui/CoinBurst'
import type { MatchGroup } from '@/lib/auto-merge'

export type TabId = 'home' | 'merge' | 'collection' | 'more'

interface AwakenBurst {
  /** 触发时间戳（用于自动消失） */
  startedAt: number
  /** 连锁组（用于在 burst 上画高亮位置） */
  groups: MatchGroup[]
  /** 最长连锁长度 */
  longest: number
}

interface UiState {
  tab: TabId
  setTab: (t: TabId) => void
  toasts: Array<{ id: string; text: string; emoji?: string; tier?: 0 | 1 | 2 | 3 }>
  pushToast: (text: string, emoji?: string, tier?: 0 | 1 | 2 | 3) => void
  bursts: CoinBurst[]
  pushBurst: (b: CoinBurst) => void
  settleBurst: (id: string) => void
  confettiKey: number
  burstConfetti: () => void
  muted: boolean
  setMuted: (m: boolean) => void
  showGuide: string | null
  setGuide: (g: string | null) => void
  showZoneGallery: boolean
  openZoneGallery: () => void
  closeZoneGallery: () => void
  // v0.4
  showCheckin: boolean
  openCheckin: () => void
  closeCheckin: () => void
  showStats: boolean
  openStats: () => void
  closeStats: () => void
  // v0.5
  showAchievements: boolean
  openAchievements: () => void
  closeAchievements: () => void
  showOutfits: boolean
  openOutfits: () => void
  closeOutfits: () => void
  showSettings: boolean
  openSettings: () => void
  closeSettings: () => void
  // v0.6
  showShare: boolean
  openShare: () => void
  closeShare: () => void
  shareCard: { emoji: string; level: number; title: string } | null
  setShareCard: (c: { emoji: string; level: number; title: string } | null) => void
  showLeaderboard: boolean
  openLeaderboard: () => void
  closeLeaderboard: () => void
  // v0.9 主题羁绊
  showSynergies: boolean
  openSynergies: () => void
  closeSynergies: () => void
  // v2.1 觉醒 burst
  awakenBurst: AwakenBurst | null
  triggerAwakenBurst: (groups: MatchGroup[], longest: number) => void
  clearAwakenBurst: () => void
}

let _toastId = 0

export const useUiStore = create<UiState>((set) => ({
  tab: 'home',
  setTab: (t) => set({ tab: t }),
  toasts: [],
  pushToast: (text, emoji, tier) => {
    const id = `toast_${++_toastId}`
    set(s => ({ toasts: [...s.toasts, { id, text, emoji, tier }] }))
    setTimeout(() => {
      set(s => ({ toasts: s.toasts.filter(t => t.id !== id) }))
    }, 1800)
  },
  bursts: [],
  pushBurst: (b) => {
    set(s => {
      // v2.2 限流：最多同时显示 3 个 burst，避免屏幕 emoji 堆积
      const next = [...s.bursts, b]
      if (next.length > 3) {
        // 移除最旧的几个（按 id 时间戳排序）
        return { bursts: next.slice(next.length - 3) }
      }
      return { bursts: next }
    })
  },
  settleBurst: (id) => {
    set(s => ({ bursts: s.bursts.filter(b => b.id !== id) }))
  },
  confettiKey: 0,
  burstConfetti: () => set(s => ({ confettiKey: s.confettiKey + 1 })),
  muted: false,
  setMuted: (m) => set({ muted: m }),
  showGuide: null,
  setGuide: (g) => {
    set({ showGuide: g })
    if (g) {
      setTimeout(() => {
        set(s => (s.showGuide === g ? { showGuide: null } : {}))
      }, 2500)
    }
  },
  showZoneGallery: false,
  openZoneGallery: () => set({ showZoneGallery: true }),
  closeZoneGallery: () => set({ showZoneGallery: false }),
  // v0.4
  showCheckin: false,
  openCheckin: () => set({ showCheckin: true }),
  closeCheckin: () => set({ showCheckin: false }),
  showStats: false,
  openStats: () => set({ showStats: true }),
  closeStats: () => set({ showStats: false }),
  // v0.5
  showAchievements: false,
  openAchievements: () => set({ showAchievements: true }),
  closeAchievements: () => set({ showAchievements: false }),
  showOutfits: false,
  openOutfits: () => set({ showOutfits: true }),
  closeOutfits: () => set({ showOutfits: false }),
  showSettings: false,
  openSettings: () => set({ showSettings: true }),
  closeSettings: () => set({ showSettings: false }),
  // v0.6
  showShare: false,
  openShare: () => set({ showShare: true }),
  closeShare: () => set({ showShare: false }),
  shareCard: null,
  setShareCard: (c) => set({ shareCard: c }),
  showLeaderboard: false,
  openLeaderboard: () => set({ showLeaderboard: true }),
  closeLeaderboard: () => set({ showLeaderboard: false }),
  // v0.9 主题羁绊
  showSynergies: false,
  openSynergies: () => set({ showSynergies: true }),
  closeSynergies: () => set({ showSynergies: false }),
  // v2.1 觉醒 burst（5+ 连锁触发 2s 全屏慢动作 + 色环 + 文字）
  awakenBurst: null,
  triggerAwakenBurst: (groups, longest) => {
    set({ awakenBurst: { startedAt: Date.now(), groups, longest } })
    setTimeout(() => {
      set(s => (s.awakenBurst && Date.now() - s.awakenBurst.startedAt >= 1900 ? { awakenBurst: null } : {}))
    }, 2000)
  },
  clearAwakenBurst: () => set({ awakenBurst: null }),
}))
