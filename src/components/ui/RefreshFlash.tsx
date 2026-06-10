/**
 * v9.2 刷新网格全屏紫青 flash 0.4s
 * - 监听 uiStore.refreshTick 变化
 * - 触发全屏紫青径向过场 + 中心 "🔄" emoji 短暂出现
 */
import { useEffect, useState } from 'react'
import { useUiStore } from '@/store/uiStore'

export function RefreshFlash() {
  const tick = useUiStore(s => s.refreshTick)
  const [show, setShow] = useState(false)
  const [key, setKey] = useState(0)

  useEffect(() => {
    if (tick > 0) {
      setKey(tick)
      setShow(true)
      const t = setTimeout(() => setShow(false), 400)
      return () => clearTimeout(t)
    }
  }, [tick])

  if (!show) return null

  return (
    <div
      key={key}
      className="pointer-events-none fixed inset-0 z-[55] flex items-center justify-center"
      style={{
        background: 'radial-gradient(circle, rgba(167,139,250,0.45) 0%, rgba(103,232,249,0.18) 40%, transparent 80%)',
        animation: 'refreshFlashIn 0.4s ease-out forwards',
      }}
    >
      <div
        className="text-7xl"
        style={{
          filter: 'drop-shadow(0 0 18px rgba(167,139,250,0.9))',
          animation: 'refreshIconPop 0.4s ease-out forwards',
        }}
      >
        🔄
      </div>
      <style>{`
        @keyframes refreshFlashIn {
          0% { opacity: 0; transform: scale(0.9); }
          30% { opacity: 1; transform: scale(1); }
          100% { opacity: 0; transform: scale(1.1); }
        }
        @keyframes refreshIconPop {
          0% { transform: scale(0.4) rotate(-30deg); opacity: 0; }
          40% { transform: scale(1.4) rotate(0deg); opacity: 1; }
          100% { transform: scale(0.9) rotate(360deg); opacity: 0; }
        }
      `}</style>
    </div>
  )
}
