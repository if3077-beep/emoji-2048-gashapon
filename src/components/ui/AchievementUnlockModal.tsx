/**
 * v5.1 成就解锁祝贺弹层 → 简略 stack 展示
 * - 单成就：紧凑卡片 + 收下
 * - 多成就：stack 显示最多 3 张（剩余折叠"+N 更多"）
 *   - 一键"📋 全部收下 (+N 🪙)" 一次清队列
 *   - 顶标 "✨ N/total" 进度 + 关闭即按时间线一次收下
 */
import { useEffect } from 'react'
import gsap from 'gsap'
import { useGameStore } from '@/store/gameStore'
import { useUiStore } from '@/store/uiStore'
import { CATEGORY_LABELS } from '@/lib/achievements'
import { sfx } from '@/lib/audio'

export function AchievementUnlockModal() {
  const current = useGameStore(s => s.currentAchievement)
  const dismiss = useGameStore(s => s.dismissCurrentAchievement)
  const pending = useGameStore(s => s.pendingAchievements)
  const clearAll = useGameStore(s => s.clearAchievementQueue)
  const burstConfetti = useUiStore(s => s.burstConfetti)

  useEffect(() => {
    if (current) {
      burstConfetti()
      gsap.fromTo(
        '.ach-card',
        { scale: 0.7, opacity: 0, y: 10 },
        { scale: 1, opacity: 1, y: 0, duration: 0.35, ease: 'back.out(1.4)', stagger: 0.05 },
      )
    }
  }, [current?.id])

  if (!current) return null

  const meta = CATEGORY_LABELS[current.category]
  const totalCount = pending.length + 1
  const hasMultiple = totalCount > 1
  // v5.1 简略 stack：最多展示 3 张（当前 + 队列前 2 个），剩余折叠
  const STACK_LIMIT = 3
  const all = [current, ...pending]
  const visible = all.slice(0, STACK_LIMIT)
  const moreCount = Math.max(0, all.length - STACK_LIMIT)
  const totalReward = all.reduce((s, a) => s + a.reward, 0)

  const handleClearAll = () => {
    sfx.achievement()
    burstConfetti()
    clearAll()
  }

  return (
    <div
      className="pointer-events-auto fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={dismiss}
    >
      <div
        className="relative flex w-[90vw] max-w-sm flex-col items-center gap-2 rounded-3xl p-4 shadow-2xl"
        style={{
          background: 'linear-gradient(160deg, rgba(251,191,36,0.18) 0%, rgba(167,139,250,0.15) 100%)',
          border: `2px solid ${meta.color}88`,
          boxShadow: `0 0 40px ${meta.color}66`,
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* 角标 + 进度 */}
        <div className="flex w-full items-center justify-between">
          <div className="rounded-full bg-gold-500 px-3 py-1 text-[10px] font-bold text-ink-900">
            🏆 成就达成
          </div>
          {hasMultiple && (
            <div className="rounded-full bg-gold-500/25 px-2.5 py-0.5 text-[10px] font-extrabold text-gold-200 ring-1 ring-gold-400/40">
              ✨ {totalCount} 个
            </div>
          )}
        </div>

        {/* v5.1 stack 列表：最多 3 张 */}
        <div className="flex w-full flex-col gap-1.5">
          {visible.map((a, i) => {
            const m = CATEGORY_LABELS[a.category]
            return (
              <div
                key={a.id}
                className="ach-card flex items-center gap-2.5 rounded-2xl p-2.5"
                style={{
                  background: i === 0 ? `${m.color}15` : 'rgba(255,255,255,0.04)',
                  border: `1px solid ${i === 0 ? m.color + '66' : 'rgba(255,255,255,0.06)'}`,
                }}
              >
                <div
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-2xl"
                  style={{ background: `${m.color}30`, boxShadow: `0 0 10px ${m.color}44` }}
                >
                  {a.icon}
                </div>
                <div className="min-w-0 flex-1 text-left">
                  <div className="flex items-center gap-1 text-[9px] font-bold" style={{ color: m.color }}>
                    {m.icon} {m.label}
                    {i === 0 && hasMultiple && <span className="ml-1 text-white/40">· 最新</span>}
                  </div>
                  <div className="truncate text-sm font-bold text-white">{a.title}</div>
                  <div className="truncate text-[10px] text-white/50">{a.desc}</div>
                </div>
                {a.reward > 0 && (
                  <div className="shrink-0 text-right">
                    <div className="text-xs font-extrabold text-gold-300">+{a.reward}</div>
                    <div className="text-[9px] text-white/30">🪙</div>
                  </div>
                )}
              </div>
            )
          })}
          {moreCount > 0 && (
            <div className="rounded-2xl bg-white/[0.03] px-3 py-1.5 text-center text-[10px] text-white/40 ring-1 ring-white/5">
              还有 <span className="text-gold-300 font-bold">+{moreCount}</span> 个
            </div>
          )}
        </div>

        {/* 总奖励 + 按钮 */}
        {hasMultiple && (
          <div className="w-full text-center text-[10px] text-white/40">
            总奖励 <span className="text-gold-300 font-bold">+{totalReward} 🪙</span>
          </div>
        )}

        <div className="flex w-full gap-2">
          <button
            onClick={dismiss}
            className="touch-target flex-1 rounded-full bg-white/10 py-2 text-sm font-bold text-white active:scale-95"
            style={{ border: '1px solid rgba(255,255,255,0.15)' }}
          >
            收下奖励
          </button>
          {hasMultiple && (
            <button
              onClick={handleClearAll}
              className="touch-target flex-1 rounded-full bg-gradient-to-r from-gold-500 to-amber-500 py-2 text-sm font-extrabold text-ink-900 active:scale-95"
              style={{ boxShadow: '0 0 14px rgba(251,191,36,0.55)' }}
            >
              📋 全部收下
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
