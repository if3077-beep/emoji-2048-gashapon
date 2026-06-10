/**
 * v13.0/v13.1 重开一局二次确认 modal
 * - 紫红渐变背景，⚠️ 大字
 * - 4 行进度说明（会失去 / 会保留）
 * - 长按 1s 确认按钮（v13.1）防误触
 * - ESC 关闭 / Enter 确认（v13.3）
 * - 点击遮罩关闭
 */
import { useEffect, useRef, useState } from 'react'
import { useGameStore } from '@/store/gameStore'
import { useUiStore } from '@/store/uiStore'

const HOLD_MS = 1000

export function ResetConfirmModal() {
  const open = useUiStore(s => s.confirmResetOpen)
  const setOpen = useUiStore(s => s.setConfirmResetOpen)
  const addCoins = useGameStore(s => s.addCoins)
  const pushToast = useUiStore(s => s.pushToast)
  const reset = useGameStore(s => s.reset)
  const resetUi = useUiStore(s => s.resetUi)
  const setTab = useUiStore(s => s.setTab)
  const bumpResetCount = useUiStore(s => s.bumpResetCount)
  const burstConfetti = useUiStore(s => s.burstConfetti)
  const readZones = useUiStore(s => s.readZones)
  const favoriteZones = useUiStore(s => s.favoriteZones)
  const bestCombo = useGameStore(s => s.bestCombo)
  const totalPulls = useGameStore(s => s.totalPulls)
  const maxLevel = useGameStore(s => s.maxLevel)
  const [holdProgress, setHoldProgress] = useState(0)
  const holdTimerRef = useRef<number | null>(null)
  const holdStartRef = useRef<number>(0)

  // 长按 1s
  const startHold = () => {
    holdStartRef.current = Date.now()
    setHoldProgress(0)
    holdTimerRef.current = window.setInterval(() => {
      const elapsed = Date.now() - holdStartRef.current
      const p = Math.min(1, elapsed / HOLD_MS)
      setHoldProgress(p)
      if (p >= 1) {
        stopHold()
        doReset()
      }
    }, 16)
  }
  const stopHold = () => {
    if (holdTimerRef.current !== null) {
      clearInterval(holdTimerRef.current)
      holdTimerRef.current = null
    }
    setHoldProgress(0)
  }

  const doReset = () => {
    bumpResetCount()
    reset()
    resetUi()
    // v13.1 重开奖励 +50🪙
    addCoins(50)
    pushToast('🎁 重开奖励 +50🪙，3 局内扭蛋 ×1.5！', '🎁', 0)
    // v13.2 重开成就：累计 1/3/5/10
    const newCount = useUiStore.getState().resetCount
    if ([1, 3, 5, 10].includes(newCount)) {
      setTimeout(() => {
        pushToast(`🔁 破而后立 · 累计重开 ${newCount} 次！`, '🔁', 1)
      }, 600)
    }
    // v13.0 紫青全屏过场
    burstConfetti()
    setTab('home')
    setOpen(false)
    setHoldProgress(0)
  }

  // ESC 关闭 + Enter 确认 + 清理 timer
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        stopHold()
        setOpen(false)
      } else if (e.key === 'Enter' && holdProgress >= 1) {
        doReset()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('keydown', onKey)
      stopHold()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, holdProgress])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={() => { stopHold(); setOpen(false) }}
    >
      <div
        className="w-[80vw] max-w-sm rounded-3xl p-5"
        style={{
          background: 'linear-gradient(155deg, rgba(76,29,149,0.96) 0%, rgba(159,18,57,0.96) 100%)',
          border: '1px solid rgba(244,114,182,0.5)',
          boxShadow: '0 0 40px rgba(244,114,182,0.4), 0 8px 30px rgba(0,0,0,0.5)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ⚠️ 大字 */}
        <div className="mb-3 flex items-center gap-2">
          <span className="text-3xl">⚠️</span>
          <div>
            <div className="text-base font-bold text-pink-100">重开一局？</div>
            <div className="text-[10px] text-pink-200/70">Reset &amp; Start Over</div>
          </div>
        </div>

        {/* 4 行说明 */}
        <div className="mb-3 space-y-1 rounded-2xl bg-black/30 p-3 text-[11px]">
          <div className="flex items-center gap-2 text-rose-200/90">
            <span>📊</span>
            <span>进度清零：当前 {totalPulls} 扭蛋 · 最佳连击 {bestCombo} · 最高 Lv.{maxLevel}</span>
          </div>
          <div className="flex items-center gap-2 text-rose-200/90">
            <span>🐾</span>
            <span>宠物 / 签到 / 7 日挑战 / 货币全部清零</span>
          </div>
          <div className="flex items-center gap-2 text-emerald-300">
            <span>✅</span>
            <span>收藏 {favoriteZones.length}/12 个主题、已读 {readZones.length}/12 个故事保留</span>
          </div>
          <div className="flex items-center gap-2 text-amber-300">
            <span>🎁</span>
            <span>重开送 +50🪙，3 局内扭蛋 ×1.5 倍</span>
          </div>
        </div>

        {/* 双按钮 */}
        <div className="flex gap-2">
          <button
            onClick={() => { stopHold(); setOpen(false) }}
            className="touch-target flex-1 rounded-full bg-white/10 py-2 text-[12px] font-bold text-white/80 active:scale-95"
          >
            取消
          </button>
          {/* v13.1 长按 1s 确认按钮 */}
          <button
            onMouseDown={startHold}
            onMouseUp={stopHold}
            onMouseLeave={stopHold}
            onTouchStart={startHold}
            onTouchEnd={stopHold}
            onTouchCancel={stopHold}
            className="touch-target relative flex-1 overflow-hidden rounded-full bg-gradient-to-r from-rose-500 to-pink-500 py-2 text-[12px] font-bold text-white active:scale-95"
            style={{ boxShadow: '0 0 12px rgba(244,114,182,0.5)' }}
          >
            <div
              className="absolute inset-0 bg-white/20 transition-none"
              style={{ width: `${holdProgress * 100}%` }}
            />
            <span className="relative z-10">
              {holdProgress >= 1 ? '🔁 确认重开' : '🔁 长按 1s 确认'}
            </span>
          </button>
        </div>
        <div className="mt-2 text-center text-[9px] text-white/40">
          ESC 取消 · Enter 确认（按住到底后）
        </div>
      </div>
    </div>
  )
}
