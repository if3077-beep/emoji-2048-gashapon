/**
 * v2.1 觉醒凝视：5+ 连锁触发全屏 2s 慢动作 + 色环 + 大字
 * - radial 渐变 + 旋转 + 缩放
 * - 2s 后自动消失
 */
import { useEffect } from 'react'
import gsap from 'gsap'
import { useUiStore } from '@/store/uiStore'

export function AwakenBurst() {
  const burst = useUiStore(s => s.awakenBurst)

  useEffect(() => {
    if (!burst) return
    const el = document.getElementById('awaken-burst-text')
    if (el) {
      gsap.fromTo(
        el,
        { scale: 0.3, opacity: 0, rotate: -8 },
        { scale: 1.15, opacity: 1, rotate: 0, duration: 0.5, ease: 'back.out(1.7)' },
      )
    }
    const ring = document.getElementById('awaken-burst-ring')
    if (ring) {
      gsap.fromTo(
        ring,
        { scale: 0.2, opacity: 0 },
        { scale: 1.6, opacity: 1, duration: 0.6, ease: 'power2.out' },
      )
    }
  }, [burst?.startedAt])

  if (!burst) return null

  return (
    <div className="pointer-events-none fixed inset-0 z-40 flex items-center justify-center">
      {/* 色环 + 慢动作遮罩 */}
      <div
        id="awaken-burst-ring"
        className="absolute h-[120vmin] w-[120vmin] rounded-full"
        style={{
          background:
            'conic-gradient(from 0deg, #ff4e8d, #ffb84d, #4dffd1, #4d9bff, #b84dff, #ff4e8d)',
          filter: 'blur(28px)',
          opacity: 0.7,
          animation: 'awakenSpin 2s linear forwards',
        }}
      />
      {/* 中央暗影 */}
      <div
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(circle, transparent 22%, rgba(0,0,0,0.55) 80%)',
        }}
      />
      {/* 大字 */}
      <div
        id="awaken-burst-text"
        className="relative z-10 text-center"
        style={{ animation: 'awakenGlow 1.8s ease-out forwards' }}
      >
        <div className="text-7xl font-extrabold tracking-tight" style={{ color: '#fff', textShadow: '0 0 30px #fff, 0 0 60px #ff4e8d' }}>
          ✨ 觉醒 ✨
        </div>
        <div className="mt-2 text-2xl font-bold" style={{ color: '#fff', textShadow: '0 0 20px #ffb84d' }}>
          {burst.longest} 连锁！
        </div>
        <div className="mt-1 text-sm text-white/70">{burst.groups.length} 组同色同心</div>
      </div>
      <style>{`
        @keyframes awakenSpin {
          from { transform: rotate(0deg) scale(0.4); }
          to   { transform: rotate(360deg) scale(2.2); opacity: 0; }
        }
        @keyframes awakenGlow {
          0%   { letter-spacing: 0.1em; }
          50%  { letter-spacing: 0.4em; }
          100% { letter-spacing: 0.2em; opacity: 0; }
        }
      `}</style>
    </div>
  )
}
