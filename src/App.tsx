/**
 * App 主壳（v0.3：全局层挂载 CoinBurst/ComboMeter/ZoneGallery，v0.4：Checkin/Stats/回归，v0.5：成就/装扮/设置，v0.6：分享/排行）
 */
import { useEffect, useState } from 'react'
import { useGameStore } from '@/store/gameStore'
import { useUiStore } from '@/store/uiStore'
import { HomeTab } from '@/components/tabs/HomeTab'
import { CollectionTab } from '@/components/tabs/CollectionTab'
import { MoreTab } from '@/components/tabs/MoreTab'
import { Pet } from '@/components/pet/Pet'
import { Toaster } from '@/components/ui/Toaster'
import { Confetti } from '@/components/ui/Confetti'
import { Guide } from '@/components/ui/Guide'
import { CoinBurstLayer } from '@/components/ui/CoinBurst'
import { ComboMeter } from '@/components/ui/ComboMeter'
import { ZoneGallery } from '@/components/collection/ZoneGallery'
import { CheckinPanel } from '@/components/ui/CheckinPanel'
import { ComebackModal } from '@/components/ui/ComebackModal'
import { StatsPanel } from '@/components/ui/StatsPanel'
import { AchievementsPanel } from '@/components/ui/AchievementsPanel'
import { OutfitsPanel } from '@/components/ui/OutfitsPanel'
import { SettingsPanel } from '@/components/ui/SettingsPanel'
import { SharePanel } from '@/components/ui/SharePanel'
import { LeaderboardPanel } from '@/components/ui/LeaderboardPanel'
import { RandomEventModal } from '@/components/ui/RandomEventModal'
import { EventBuffBadge } from '@/components/ui/EventBuffBadge'
import { SynergiesPanel } from '@/components/ui/SynergiesPanel'
import { AchievementUnlockModal } from '@/components/ui/AchievementUnlockModal'
import { AwakenBurst } from '@/components/ui/AwakenBurst'

// v5.0 底栏 3 列：主页（已整合合成 + 扭蛋机）/ 图鉴 / 更多
const TABS = [
  { id: 'home' as const, icon: '🏠', label: '主页' },
  { id: 'collection' as const, icon: '📖', label: '图鉴' },
  { id: 'more' as const, icon: '⚙️', label: '更多' },
]

export default function App() {
  const tab = useUiStore(s => s.tab)
  const setTab = useUiStore(s => s.setTab)
  const pet = useGameStore(s => s.pet)
  const tutorialStep = useGameStore(s => s.tutorialStep)
  const combo = useGameStore(s => s.combo)
  const bursts = useUiStore(s => s.bursts)
  const settleBurst = useUiStore(s => s.settleBurst)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    useGameStore.getState().load()
    setLoaded(true)
    // v0.4 启动时检测回归
    useGameStore.getState().detectComeback()
    // 关页面前
    const onUnload = () => useGameStore.getState().beforeUnload()
    window.addEventListener('beforeunload', onUnload)
    return () => window.removeEventListener('beforeunload', onUnload)
  }, [])

  useEffect(() => {
    if (!loaded) return
    if (pet && tutorialStep === 3) {
      useUiStore.getState().burstConfetti()
      useUiStore.getState().setGuide(`🥚 哇！${pet.name} 出生了！点击主页喂养它`)
    }
  }, [pet?.id, loaded, tutorialStep])

  if (!loaded) {
    return (
      <div className="flex h-full items-center justify-center text-white/40">
        <div className="text-2xl animate-spin">⚙️</div>
      </div>
    )
  }

  return (
    <div id="app-root" className="mx-auto flex h-full w-full max-w-[480px] flex-col">
      <header className="flex w-full items-center justify-between px-4 py-2 pt-[max(8px,env(safe-area-inset-top))]">
        <div className="flex items-center gap-1.5">
          <span className="text-lg">🌟</span>
          <div className="flex flex-col leading-tight">
            <span className="text-sm font-bold text-white/90">扭蛋 2048</span>
            <span className="text-[9px] text-white/30">合成生态 v0.7</span>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <EventBuffBadge />
          {tutorialStep <= 4 && (
            <div className="text-[10px] text-white/30">教程 {tutorialStep}/4</div>
          )}
        </div>
      </header>

      <main className="flex-1 overflow-y-auto scrollbar-hidden pb-[max(70px,calc(60px+env(safe-area-inset-bottom)))]">
        <div key={tab} className="animate-pop">
          {tab === 'home' && <HomeTab />}
          {tab === 'collection' && <CollectionTab />}
          {tab === 'more' && <MoreTab />}
        </div>
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-20 flex glass-strong border-t border-white/5 pb-[env(safe-area-inset-bottom)]">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`touch-target flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] transition-all ${
              tab === t.id ? 'text-gold-400' : 'text-white/40'
            }`}
          >
            <span className={`text-lg transition-transform ${tab === t.id ? 'scale-110' : 'scale-100'}`}>
              {t.icon}
            </span>
            <span>{t.label}</span>
          </button>
        ))}
      </nav>

      {/* 全局层 */}
      <Pet />
      <Toaster />
      <Confetti />
      <Guide />
      <CoinBurstLayer bursts={bursts} onSettle={settleBurst} />
      <ComboMeter combo={combo} />
      <ZoneGallery />
      <CheckinPanel />
      <ComebackModal />
      <StatsPanel />
      <AchievementsPanel />
      <OutfitsPanel />
      <SettingsPanel />
      <SharePanel />
      <LeaderboardPanel />
      <RandomEventModal />
      <EventBuffBadge />
      <SynergiesPanel />
      <AchievementUnlockModal />
      <AwakenBurst />
    </div>
  )
}
