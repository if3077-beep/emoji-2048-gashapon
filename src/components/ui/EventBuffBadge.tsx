/**
 * v0.7 当前激活的事件 buff 提示
 * - 屏幕右上角 / 主页顶部
 * - 显示 emoji + 标题 + 倒计时进度
 */
import { useEffect, useState } from 'react'
import { useGameStore } from '@/store/gameStore'

export function EventBuffBadge() {
  const buff = useGameStore(s => s.activeEventBuff)
  const [now, setNow] = useState(Date.now())

  useEffect(() => {
    if (!buff) return
    const t = setInterval(() => setNow(Date.now()), 500)
    return () => clearInterval(t)
  }, [buff])

  if (!buff) return null
  const remaining = Math.max(0, buff.expiresAt - now)
  const total = remaining > 0 ? Math.min(60_000, remaining + 5_000) : 60_000

  if (remaining <= 0) {
    return null
  }

  return (
    <div
      className="pointer-events-none flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold text-white shadow-lg backdrop-blur-sm"
      style={{
        background: `${buff.color}33`,
        border: `1px solid ${buff.color}55`,
        boxShadow: `0 0 12px ${buff.color}44`,
      }}
    >
      <span className="text-sm">{buff.emoji}</span>
      <span style={{ color: buff.color }}>{buff.title}</span>
      <span className="font-mono text-white/70">{Math.ceil(remaining / 1000)}s</span>
      <div
        className="absolute bottom-0 left-0 h-0.5 rounded-full transition-all"
        style={{
          width: `${(remaining / total) * 100}%`,
          background: buff.color,
        }}
      />
    </div>
  )
}
