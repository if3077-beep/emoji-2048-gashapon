/**
 * 货币爆发：屏幕金粉 + 数字爆涨 + 数字滚动 + 屏幕震动
 * 接收强度等级 0-3，3 最高（神级全屏）
 */
import { useEffect, useState } from 'react'
import gsap from 'gsap'

export interface CoinBurst {
  id: string
  amount: number
  text: string
  emoji: string
  intensity: 0 | 1 | 2 | 3
  color: string
  /** 起始位置（屏幕坐标） */
  x: number
  y: number
}

interface Props {
  bursts: CoinBurst[]
  onSettle: (id: string) => void
}

export function CoinBurstLayer({ bursts, onSettle }: Props) {
  return (
    <div className="pointer-events-none fixed inset-0 z-30">
      {bursts.map(b => (
        <Burst key={b.id} burst={b} onSettle={() => onSettle(b.id)} />
      ))}
    </div>
  )
}

function Burst({ burst, onSettle }: { burst: CoinBurst; onSettle: () => void }) {
  const [particles, setParticles] = useState<Array<{ id: number; angle: number; distance: number; delay: number; scale: number }>>([])

  useEffect(() => {
    // 强度 → 粒子数
    const count = burst.intensity === 3 ? 32 : burst.intensity === 2 ? 20 : burst.intensity === 1 ? 10 : 5
    const ps = Array.from({ length: count }, (_, i) => ({
      id: i,
      angle: (i / count) * Math.PI * 2 + Math.random() * 0.4,
      distance: 50 + Math.random() * (40 + burst.intensity * 30),
      delay: Math.random() * 0.05,
      scale: 0.6 + Math.random() * 0.6 + burst.intensity * 0.15,
    }))
    setParticles(ps)

    // 屏幕震动
    if (burst.intensity >= 2) {
      gsap.to('#app-root', {
        x: burst.intensity === 3 ? 6 : 3,
        y: burst.intensity === 3 ? -4 : 2,
        duration: 0.04,
        repeat: 4,
        yoyo: true,
        onComplete: () => gsap.to('#app-root', { x: 0, y: 0, duration: 0.1 }),
      })
    }

    // 自动消失
    const t = setTimeout(onSettle, 1500 + burst.intensity * 200)
    return () => clearTimeout(t)
  }, [burst.id, burst.intensity, onSettle])

  const targetX = 60   // 货币栏位置（左上）
  const targetY = 50

  return (
    <>
      {/* 粒子 */}
      {particles.map(p => {
        const dx = Math.cos(p.angle) * p.distance
        const dy = Math.sin(p.angle) * p.distance
        return (
          <span
            key={p.id}
            className="absolute text-xl"
            style={{
              left: burst.x,
              top: burst.y,
              transform: `translate(-50%, -50%)`,
              color: burst.color,
              filter: `drop-shadow(0 0 4px ${burst.color})`,
              animation: `particleBurst 0.6s ${p.delay}s cubic-bezier(.22,1,.36,1) forwards`,
              ['--dx' as any]: `${dx}px`,
              ['--dy' as any]: `${dy}px`,
              ['--tx' as any]: `${targetX - burst.x}px`,
              ['--ty' as any]: `${targetY - burst.y}px`,
              ['--scale' as any]: p.scale,
            }}
          >
            {burst.emoji}
          </span>
        )
      })}

      {/* 主文字 + 数字（爆涨） */}
      <div
        className="absolute"
        style={{ left: burst.x, top: burst.y, transform: 'translate(-50%, -50%)' }}
      >
        <div
          className="whitespace-nowrap font-mono text-2xl font-extrabold animate-burst"
          style={{
            color: burst.color,
            textShadow: `0 0 12px ${burst.color}, 0 0 24px ${burst.color}`,
            fontSize: burst.intensity >= 2 ? '32px' : '20px',
          }}
        >
          {burst.text}
        </div>
      </div>
    </>
  )
}
