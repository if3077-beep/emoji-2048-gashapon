/**
 * v0.7 全屏随机事件卡片
 * - 屏幕中弹：emoji + 标题 + 描述
 * - 自动消失（无 durationMs 则 2 秒）
 * - 有 durationMs 则显示倒计时进度条
 */
import { useEffect, useState } from 'react'
import { useGameStore } from '@/store/gameStore'
import { sfx } from '@/lib/audio'

export function RandomEventModal() {
  const ev = useGameStore(s => s.pendingRandomEvent)
  const dismiss = useGameStore(s => s.dismissRandomEvent)
  const [exiting, setExiting] = useState(false)
  const [remaining, setRemaining] = useState(0)

  useEffect(() => {
    if (!ev) return
    sfx.celebrate()
    if (!ev.durationMs) {
      // 即时事件：2 秒后自动消失
      const t = setTimeout(() => {
        setExiting(true)
        setTimeout(() => { dismiss(); setExiting(false) }, 250)
      }, 2000)
      return () => clearTimeout(t)
    } else {
      // 持续事件：4 秒后自动关闭卡片
      setRemaining(ev.durationMs)
      const start = Date.now()
      const interval = setInterval(() => {
        const elapsed = Date.now() - start
        setRemaining(Math.max(0, ev.durationMs! - elapsed))
      }, 100)
      const t = setTimeout(() => {
        setExiting(true)
        setTimeout(() => { dismiss(); setExiting(false) }, 250)
      }, 4000)
      return () => { clearInterval(interval); clearTimeout(t) }
    }
  }, [ev, dismiss])

  if (!ev) return null

  const onTap = () => {
    setExiting(true)
    setTimeout(() => { dismiss(); setExiting(false) }, 250)
  }

  return (
    <div
      className={`pointer-events-none fixed inset-0 z-50 flex items-center justify-center transition-opacity duration-200 ${
        exiting ? 'opacity-0' : 'opacity-100'
      }`}
      onClick={onTap}
    >
      <div className="pointer-events-auto absolute inset-0 bg-black/30 backdrop-blur-sm" />
      <div
        className={`pointer-events-auto relative max-w-[320px] animate-pop rounded-3xl px-6 py-7 text-center shadow-2xl`}
        style={{
          background: `linear-gradient(135deg, ${ev.color}22, rgba(20,20,30,0.95))`,
          border: `1.5px solid ${ev.color}66`,
          boxShadow: `0 0 60px ${ev.color}55, 0 12px 40px rgba(0,0,0,0.5)`,
        }}
      >
        <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-5xl drop-shadow-lg">
          {ev.emoji}
        </div>
        <div className="mt-3 text-[10px] uppercase tracking-[0.2em] text-white/50">
          随机事件
        </div>
        <div className="mt-1 text-2xl font-bold text-white">
          {ev.title}
        </div>
        <div className="mt-2 text-sm text-white/70 leading-relaxed">
          {ev.desc}
        </div>
        {ev.durationMs ? (
          <div className="mt-4">
            <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full transition-all"
                style={{
                  width: `${(remaining / ev.durationMs) * 100}%`,
                  background: ev.color,
                }}
              />
            </div>
            <div className="mt-1 text-[10px] text-white/40">
              {Math.ceil(remaining / 1000)}s
            </div>
          </div>
        ) : (
          <div className="mt-4 text-[10px] text-white/30">
            点击任意处关闭
          </div>
        )}
      </div>
    </div>
  )
}
