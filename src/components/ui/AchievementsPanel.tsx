/**
 * 成就面板 v0.5
 * - 6 类共 40+ 成就
 * - 进度条 + 解锁奖励
 */
import { useMemo } from 'react'
import { useGameStore } from '@/store/gameStore'
import { useUiStore } from '@/store/uiStore'
import { ACHIEVEMENTS, CATEGORY_LABELS, computeAchievementProgress, type AchievementCategory } from '@/lib/achievements'
import { MAX_LEVEL } from '@/data/emoji-trees'

export function AchievementsPanel() {
  const show = useUiStore(s => s.showAchievements)
  const close = useUiStore(s => s.closeAchievements)
  const mergeCount = useGameStore(s => s.mergeCount)
  const totalPulls = useGameStore(s => s.totalPulls)
  const maxLevel = useGameStore(s => s.maxLevel)
  const bestCombo = useGameStore(s => s.bestCombo)
  const collection = useGameStore(s => s.collection)
  const zoneMax = useGameStore(s => s.zoneMax)
  const pet = useGameStore(s => s.pet)
  const checkin = useGameStore(s => s.checkin)

  const ctx = useMemo(() => ({
    mergeCount,
    totalPulls,
    maxLevel,
    bestCombo,
    awakenCount: pet?.awakenCount ?? 0,
    zoneMax,
    collection,
    pet,
    petAffection: pet?.affection ?? 0,
    totalCheckins: checkin.totalCheckins,
    totalSessions: 1,
  }), [mergeCount, totalPulls, maxLevel, bestCombo, zoneMax, collection, pet, checkin])

  const grouped = useMemo(() => {
    const g: Record<AchievementCategory, typeof ACHIEVEMENTS> = {
      merge: [], collect: [], gacha: [], pet: [], combo: [], awaken: [],
    }
    ACHIEVEMENTS.forEach(a => g[a.category].push(a))
    return g
  }, [])

  if (!show) return null

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/60 backdrop-blur-sm sm:items-center" onClick={close}>
      <div
        className="relative flex h-[85vh] w-full max-w-[440px] flex-col glass-strong rounded-t-3xl p-5 sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between">
          <div>
            <div className="text-base font-bold text-white/90">🏆 成就</div>
            <div className="mt-0.5 text-[10px] text-white/40">共 {ACHIEVEMENTS.length} 个 · 达成 {ACHIEVEMENTS.filter(a => computeAchievementProgress(a, ctx).done).length}</div>
          </div>
          <button onClick={close} className="flex h-9 w-9 items-center justify-center rounded-full bg-white/5 text-white/60 active:scale-95" aria-label="关闭">✕</button>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-hidden">
          {(Object.keys(grouped) as AchievementCategory[]).map(cat => {
            const list = grouped[cat]
            if (list.length === 0) return null
            const meta = CATEGORY_LABELS[cat]
            const done = list.filter(a => computeAchievementProgress(a, ctx).done).length
            return (
              <div key={cat} className="mb-4">
                <div className="mb-1.5 flex items-center gap-2">
                  <span className="text-base">{meta.icon}</span>
                  <span className="text-sm font-bold" style={{ color: meta.color }}>{meta.label}</span>
                  <span className="text-[10px] text-white/30">{done}/{list.length}</span>
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  {list.map(a => {
                    const p = computeAchievementProgress(a, ctx)
                    const pct = Math.round((p.progress / a.target) * 100)
                    return (
                      <div
                        key={a.id}
                        className="rounded-xl p-2"
                        style={{
                          background: p.done ? `${meta.color}15` : 'rgba(255,255,255,0.04)',
                          border: p.done ? `1px solid ${meta.color}55` : '1px solid rgba(255,255,255,0.05)',
                        }}
                      >
                        <div className="flex items-start gap-1.5">
                          <div className="text-lg">{a.icon}</div>
                          <div className="flex-1 leading-tight">
                            <div className="flex items-center justify-between">
                              <span className={`text-[11px] font-bold ${p.done ? 'text-white' : 'text-white/70'}`}>{a.title}</span>
                              {p.done && <span className="text-[8px]" style={{ color: meta.color }}>+{a.reward}</span>}
                            </div>
                            <div className="text-[9px] text-white/40">{a.desc}</div>
                            <div className="mt-1 h-0.5 overflow-hidden rounded-full bg-white/5">
                              <div className="h-full transition-all" style={{ width: `${pct}%`, background: meta.color }} />
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
