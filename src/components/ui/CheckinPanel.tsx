/**
 * 7 日签到面板（v0.4）
 * - 7 格横排，已签到 ✓，今日待签 🔥，未来 🔒
 * - 连续 7 天解锁"太阳冠"限定宠物装扮
 */
import { useEffect, useState } from 'react'
import gsap from 'gsap'
import { useGameStore } from '@/store/gameStore'
import { useUiStore } from '@/store/uiStore'
import { CHECKIN_REWARDS, hasCheckedInToday } from '@/lib/checkin'

export function CheckinPanel() {
  const show = useUiStore(s => s.showCheckin)
  const close = useUiStore(s => s.closeCheckin)
  const checkin = useGameStore(s => s.checkin)
  const doCheckin = useGameStore(s => s.doCheckinAction)
  const setGuide = useUiStore(s => s.setGuide)
  const burstConfetti = useUiStore(s => s.burstConfetti)
  const pushToast = useUiStore(s => s.pushToast)
  const [showResult, setShowResult] = useState<{ day: number; reward: { coins: number } } | null>(null)

  useEffect(() => {
    if (show) {
      gsap.fromTo('.checkin-day', { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.4, stagger: 0.05, ease: 'back.out(1.2)' })
    }
  }, [show])

  if (!show) return null

  const today = checkin.streak >= 1 && hasCheckedInToday(checkin)
  const currentDay = checkin.streak

  const onClaim = () => {
    if (today) {
      setGuide('今天已经签到啦，明天再来～')
      return
    }
    const r = doCheckin()
    const reward = r.reward
    if (reward) {
      setShowResult({ day: checkin.streak + 1, reward: { coins: reward.coins } })
      burstConfetti()
      pushToast(
        reward.bonus?.kind === 'outfit' ? '👑 限定装扮解锁！' : `+${reward.coins}🪙`,
        reward.emoji,
        reward.bonus?.kind === 'outfit' ? 3 : 2,
      )
    }
  }

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/60 backdrop-blur-sm sm:items-center" onClick={close}>
      <div
        className="relative flex w-full max-w-[420px] flex-col glass-strong rounded-t-3xl p-5 sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between">
          <div>
            <div className="text-base font-bold text-white/90">🎁 7 日签到</div>
            <div className="mt-0.5 text-[10px] text-white/40">连续 7 天解锁「太阳冠」限定装扮</div>
          </div>
          <button onClick={close} className="flex h-9 w-9 items-center justify-center rounded-full bg-white/5 text-white/60 active:scale-95" aria-label="关闭">✕</button>
        </div>

        {/* 7 日格 */}
        <div className="mb-3 grid grid-cols-7 gap-1.5">
          {CHECKIN_REWARDS.map((r, i) => {
            const day = i + 1
            const isPast = day < currentDay || (currentDay > day)
            const isCurrent = day === currentDay && !today
            const isDone = today && day === currentDay
            const isFuture = day > currentDay + (today ? 0 : 0) || (currentDay === 0 && day > 1)
            return (
              <div
                key={r.day}
                className="checkin-day flex flex-col items-center gap-1 rounded-xl p-1.5 text-center"
                style={{
                  background: isDone
                    ? 'linear-gradient(135deg, rgba(34,197,94,0.3), rgba(34,197,94,0.1))'
                    : isCurrent
                      ? 'linear-gradient(135deg, rgba(251,191,36,0.3), rgba(251,113,133,0.2))'
                      : 'rgba(255,255,255,0.04)',
                  border: isCurrent ? '1px solid rgba(251,191,36,0.5)' : '1px solid rgba(255,255,255,0.05)',
                  boxShadow: isCurrent ? '0 0 12px rgba(251,191,36,0.3)' : 'none',
                }}
              >
                <div className="text-[8px] text-white/40">第{r.day}天</div>
                <div className="text-lg leading-none">{isDone ? '✅' : r.emoji}</div>
                <div className={`text-[8px] font-bold ${isDone ? 'text-emerald-300' : 'text-white/70'}`}>
                  {r.coins}币
                </div>
                {isCurrent && <div className="text-[7px] text-gold-300">今日</div>}
              </div>
            )
          })}
        </div>

        {/* 进度条 */}
        <div className="mb-3 flex items-center gap-2 text-[10px] text-white/60">
          <span>连续 {checkin.streak} 天</span>
          <div className="h-1 flex-1 overflow-hidden rounded-full bg-white/5">
            <div
              className="h-full transition-all"
              style={{
                width: `${(checkin.streak / 7) * 100}%`,
                background: 'linear-gradient(90deg, #fbbf24, #f97316)',
              }}
            />
          </div>
          <span>累计 {checkin.totalCheckins} 次</span>
        </div>

        {/* 领取按钮 */}
        <button
          onClick={onClaim}
          disabled={today}
          className={`touch-target w-full rounded-full py-2.5 text-sm font-bold transition-all active:scale-95 ${
            today
              ? 'bg-emerald-500/20 text-emerald-300'
              : 'bg-gradient-to-r from-gold-500 to-ember-500 text-ink-900 shadow-lg'
          }`}
        >
          {today ? '✅ 今日已签到' : checkin.streak === 0 ? '🎁 开始 7 日签到' : '🔥 继续签到'}
        </button>

        <div className="mt-3 text-center text-[9px] text-white/30">
          错过 1 天 = 断签（重置回 Day 1）
        </div>
      </div>
    </div>
  )
}
