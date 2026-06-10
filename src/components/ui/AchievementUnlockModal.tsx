/**
 * v1.1 成就解锁祝贺弹层
 * - 监听 gameStore.currentAchievement
 * - 自动从队列中取出第一个、播放撒花
 * - 用户关闭后从队列中取下一个
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
  const queueLen = useGameStore(s => s.pendingAchievements.length)
  const burstConfetti = useUiStore(s => s.burstConfetti)

  useEffect(() => {
    if (current) {
      burstConfetti()
      gsap.fromTo(
        '.ach-card',
        { scale: 0.5, opacity: 0, y: 20 },
        { scale: 1, opacity: 1, y: 0, duration: 0.4, ease: 'back.out(1.4)' },
      )
    }
  }, [current?.id])

  if (!current) return null

  const meta = CATEGORY_LABELS[current.category]

  return (
    <div
      className="pointer-events-auto fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={dismiss}
    >
      <div
        className="ach-card relative w-[85vw] max-w-sm overflow-hidden rounded-3xl p-6 text-center shadow-2xl"
        style={{
          background: 'linear-gradient(160deg, rgba(251,191,36,0.18) 0%, rgba(167,139,250,0.15) 100%)',
          border: `2px solid ${meta.color}88`,
          boxShadow: `0 0 40px ${meta.color}66`,
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* 角标 */}
        <div className="absolute -top-1 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gold-500 px-3 py-1 text-[10px] font-bold text-ink-900">
          🏆 成就达成
        </div>

        {/* 大图标 */}
        <div
          className="mx-auto mb-3 flex h-24 w-24 items-center justify-center rounded-full text-5xl"
          style={{ background: `${meta.color}25`, boxShadow: `0 0 24px ${meta.color}55` }}
        >
          {current.icon}
        </div>

        {/* 分类 */}
        <div className="mb-1 text-[10px] font-bold tracking-widest" style={{ color: meta.color }}>
          {meta.icon} {meta.label}
        </div>

        {/* 标题 */}
        <div className="text-xl font-bold text-white">{current.title}</div>
        <div className="mt-1 text-[11px] text-white/60">{current.desc}</div>

        {/* 奖励 */}
        {current.reward > 0 && (
          <div
            className="mx-auto mt-4 inline-flex items-center gap-1.5 rounded-full bg-gold-500/30 px-4 py-1.5 text-sm font-bold text-gold-300"
            style={{ border: '1px solid rgba(251,191,36,0.45)' }}
          >
            <span>🪙</span>
            <span>+{current.reward}</span>
          </div>
        )}

        {/* 队列提示 */}
        {queueLen > 0 && (
          <div className="mt-2 text-[10px] text-white/40">
            还有 {queueLen} 个成就等待领奖 →
          </div>
        )}

        {/* 关闭按钮 */}
        <button
          onClick={dismiss}
          className="touch-target mt-5 w-full rounded-full bg-white/10 py-2.5 text-sm font-bold text-white active:scale-95"
          style={{ border: '1px solid rgba(255,255,255,0.15)' }}
        >
          {queueLen > 0 ? '下一个' : '收下奖励'}
        </button>
      </div>
    </div>
  )
}
