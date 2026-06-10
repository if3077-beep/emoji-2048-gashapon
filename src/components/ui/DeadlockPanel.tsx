/**
 * v2.0 死局提示卡
 * - 显示在 MergeGrid 上方
 * - 满格 + 4 方向无可合成时显示
 * - 一键"清 Lv.1-3 兜底"按钮
 */
import gsap from 'gsap'
import { useEffect, useRef } from 'react'
import { useGameStore } from '@/store/gameStore'
import { sfx } from '@/lib/audio'

export function DeadlockPanel() {
  const isDeadlocked = useGameStore(s => s.isDeadlocked)
  const resolve = useGameStore(s => s.resolveDeadlock)
  const dismiss = useGameStore(s => s.clearDeadlock)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!ref.current) return
    if (isDeadlocked) {
      gsap.fromTo(
        ref.current,
        { y: -20, opacity: 0, scale: 0.9 },
        { y: 0, opacity: 1, scale: 1, duration: 0.4, ease: 'back.out(1.4)' },
      )
    }
  }, [isDeadlocked])

  if (!isDeadlocked) return null

  return (
    <div
      ref={ref}
      className="pointer-events-auto mx-auto w-full max-w-[400px] rounded-2xl p-3 ring-1"
      style={{
        background: 'linear-gradient(165deg, rgba(220, 38, 38, 0.15) 0%, rgba(251, 191, 36, 0.12) 100%)',
        border: '1px solid rgba(220, 38, 38, 0.45)',
        boxShadow: '0 0 20px rgba(220, 38, 38, 0.25)',
        animation: 'deadlockPulse 0.6s ease-in-out infinite',  // v8.2 紫红闪烁
      }}
    >
      <div className="flex items-center gap-2.5">
        <div
          className="flex h-10 w-10 items-center justify-center rounded-xl text-xl"
          style={{ background: 'rgba(220, 38, 38, 0.25)' }}
        >
          🪦
        </div>
        <div className="flex-1 leading-tight">
          <div className="text-sm font-bold text-rose-200">满格卡死</div>
          <div className="text-[10px] text-white/60">
            4 个方向都无法合成。一键清掉 Lv.1-3 兜底，保留 Lv.4+，奖励 50+🪙
          </div>
        </div>
      </div>
      <div className="mt-2.5 flex gap-2">
        <button
          onClick={() => {
            const r = resolve()
            if (r) sfx.crit()
          }}
          className="touch-target flex-1 rounded-full bg-gradient-to-r from-rose-500 to-amber-500 py-1.5 text-xs font-bold text-white active:scale-95"
        >
          🧹 兜底清场（+50🪙）
        </button>
        <button
          onClick={dismiss}
          className="touch-target rounded-full bg-white/5 px-3 py-1.5 text-[10px] text-white/60 active:scale-95"
          style={{ border: '1px solid rgba(255,255,255,0.1)' }}
        >
          再撑一下
        </button>
      </div>
      <style>{`
        @keyframes deadlockPulse {
          0%, 100% { box-shadow: 0 0 20px rgba(220, 38, 38, 0.25); }
          50%      { box-shadow: 0 0 32px rgba(220, 38, 38, 0.6), 0 0 12px rgba(220, 38, 38, 0.4); }
        }
      `}</style>
    </div>
  )
}
