/**
 * UI 状态（v0.2：增加 CoinBurst）
 */
import { create } from 'zustand'
import type { CoinBurst } from '@/components/ui/CoinBurst'

export type TabId = 'home' | 'merge' | 'collection' | 'more'

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
    set(s => ({ bursts: [...s.bursts, b] }))
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
}))
