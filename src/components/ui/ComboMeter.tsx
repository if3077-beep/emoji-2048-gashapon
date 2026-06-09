/**
 * 连击光带：屏幕边缘发光强度跟 combo 数走
 */
import { useEffect, useState } from 'react'

interface Props {
  combo: number
  color?: string
}

export function ComboMeter({ combo, color = '#fbbf24' }: Props) {
  const [shake, setShake] = useState(false)

  useEffect(() => {
    if (combo >= 3) {
      setShake(true)
      const t = setTimeout(() => setShake(false), 200)
      return () => clearTimeout(t)
    }
  }, [combo])

  if (combo < 2) return null

  const intensity = Math.min(combo / 10, 1)
  const tier = combo >= 10 ? 3 : combo >= 5 ? 2 : 1
  const tierText = tier === 3 ? '🔥 神级连击' : tier === 2 ? '⚡ 超级连击' : '✨ 连击'

  return (
    <>
      {/* 屏幕光带 */}
      <div
        className={`pointer-events-none fixed inset-0 z-10 transition-all duration-200 ${shake ? 'combo-pulse' : ''}`}
        style={{
          boxShadow: `inset 0 0 ${30 + intensity * 80}px ${10 + intensity * 20}px ${color}${tier === 3 ? 'cc' : tier === 2 ? '88' : '44'}`,
        }}
      />

      {/* 连击数显示 */}
      <div
        className="pointer-events-none fixed left-1/2 top-20 z-20 -translate-x-1/2 transition-all"
        style={{
          transform: `translateX(-50%) scale(${1 + intensity * 0.3})`,
        }}
      >
        <div
          className="rounded-full px-4 py-1.5 font-mono text-sm font-bold backdrop-blur-md"
          style={{
            background: `${color}22`,
            color: color,
            border: `1px solid ${color}66`,
            boxShadow: `0 0 20px ${color}44`,
          }}
        >
          <span className="text-base">{tierText}</span>
          <span className="ml-2 text-lg font-extrabold">×{combo}</span>
        </div>
      </div>
    </>
  )
}
