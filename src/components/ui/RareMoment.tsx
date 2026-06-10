/**
 * v6.2 稀有时刻：合成 Lv.10+ 触发 1.6s 全屏文字
 * - 大 emoji + "Lv.X 稀有时刻" + 紫青光晕
 */
import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { useUiStore } from '@/store/uiStore'

export function RareMoment() {
  const moment = useUiStore(s => s.rareMoment)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (moment && ref.current) {
      gsap.fromTo(
        ref.current,
        { scale: 0.4, opacity: 0, rotate: -8 },
        { scale: 1, opacity: 1, rotate: 0, duration: 0.35, ease: 'back.out(1.6)' },
      )
    }
  }, [moment?.at])

  if (!moment) return null

  return (
    <div
      className="pointer-events-none fixed inset-0 z-40 flex items-center justify-center"
      style={{
        background: 'radial-gradient(circle, transparent 35%, rgba(167,139,250,0.15) 80%)',
      }}
    >
      <div
        ref={ref}
        className="relative text-center"
        style={{
          animation: 'rareGlow 1.5s ease-out forwards',
          textShadow: '0 0 30px #a78bfa, 0 0 60px #67e8f9',
        }}
      >
        <div
          className="text-8xl"
          style={{ filter: 'drop-shadow(0 0 20px #a78bfa) drop-shadow(0 0 40px #67e8f9)' }}
        >
          {moment.emoji}
        </div>
        <div className="mt-2 text-3xl font-extrabold text-white">🌟 Lv.{moment.level} 稀有时刻 🌟</div>
        <div className="mt-1 text-sm text-violet-200">达成新等级 · 收藏已解锁</div>
      </div>
      <style>{`
        @keyframes rareGlow {
          0%   { letter-spacing: 0.1em; }
          50%  { letter-spacing: 0.4em; opacity: 1; }
          100% { letter-spacing: 0.2em; opacity: 0; }
        }
      `}</style>
    </div>
  )
}
