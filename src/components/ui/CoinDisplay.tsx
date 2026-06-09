/**
 * 货币显示（带数字滚动动画）
 */
import { useEffect, useRef, useState } from 'react'

interface Props {
  value: number
  bumpKey: number  // 变化时触发 bump
  className?: string
}

export function CoinDisplay({ value, bumpKey, className = '' }: Props) {
  const [bump, setBump] = useState(false)
  const prev = useRef(value)

  useEffect(() => {
    if (value !== prev.current) {
      setBump(true)
      prev.current = value
      const t = setTimeout(() => setBump(false), 400)
      return () => clearTimeout(t)
    }
  }, [bumpKey, value])

  return (
    <span className={`font-mono font-bold ${className} ${bump ? 'coin-bump text-gold-400' : 'text-gold-400'}`}>
      {value.toLocaleString()}
    </span>
  )
}
