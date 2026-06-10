/**
 * 货币显示（v7.0：数字滚动动画 + bump）
 */
import { useEffect, useRef, useState } from 'react'

interface Props {
  value: number
  bumpKey: number  // 变化时触发 bump
  className?: string
}

export function CoinDisplay({ value, bumpKey, className = '' }: Props) {
  const [bump, setBump] = useState(false)
  const [display, setDisplay] = useState(value)
  const prev = useRef(value)
  const rafRef = useRef<number | null>(null)

  useEffect(() => {
    if (value !== prev.current) {
      setBump(true)
      const from = prev.current
      const to = value
      const start = performance.now()
      const duration = 400
      const tick = (now: number) => {
        const t = Math.min(1, (now - start) / duration)
        // ease-out cubic
        const eased = 1 - Math.pow(1 - t, 3)
        setDisplay(Math.round(from + (to - from) * eased))
        if (t < 1) {
          rafRef.current = requestAnimationFrame(tick)
        }
      }
      rafRef.current = requestAnimationFrame(tick)
      prev.current = value
      const tm = setTimeout(() => setBump(false), 400)
      return () => {
        clearTimeout(tm)
        if (rafRef.current) cancelAnimationFrame(rafRef.current)
      }
    }
  }, [bumpKey, value])

  return (
    <span className={`font-mono font-bold tabular-nums ${className} ${bump ? 'coin-bump text-gold-400' : 'text-gold-400'}`}>
      {display.toLocaleString()}
    </span>
  )
}
