/**
 * v0.7 一键合并按钮
 * - 显示在网格下方
 * - 贪心自动滑动直到无事件
 * - 每次合并触发视觉反馈 + buff
 */
import { useState } from 'react'
import gsap from 'gsap'
import { useGameStore } from '@/store/gameStore'
import { useUiStore } from '@/store/uiStore'
import { sfx } from '@/lib/audio'
import { detectMatch3 } from '@/lib/auto-merge'

export function AutoMergeButton() {
  const grid = useGameStore(s => s.grid)
  const autoMerge = useGameStore(s => s.autoMerge)
  const pushToast = useUiStore(s => s.pushToast)
  const setGuide = useUiStore(s => s.setGuide)
  const burstConfetti = useUiStore(s => s.burstConfetti)
  const [busy, setBusy] = useState(false)

  // 计算可合并的"3 连"数量（预提示）
  const match3Count = detectMatch3(grid).length

  const handleClick = async () => {
    if (busy) return
    setBusy(true)
    const result = autoMerge()
    if (result.totalEvents.length === 0) {
      setGuide('😅 当前没有可合并的棋子')
      sfx.fail()
    } else {
      sfx.celebrate()
      pushToast(`⚡ 一键合并 +${result.totalEvents.length}`, '⚡', 2)
      if (result.totalEvents.length >= 3) {
        burstConfetti()
      }
      setGuide(`⚡ 合并 ${result.rounds} 轮 / ${result.totalEvents.length} 次`)
    }
    await new Promise(r => setTimeout(r, 350))
    setBusy(false)
  }

  return (
    <div className="flex w-full max-w-[360px] items-center justify-center gap-2">
      <button
        onClick={handleClick}
        disabled={busy}
        className={`touch-target flex flex-1 items-center justify-center gap-2 rounded-full px-4 py-2 text-sm font-bold transition-all active:scale-95 ${
          busy ? 'opacity-50' : ''
        }`}
        style={{
          background: 'linear-gradient(135deg, rgba(167,139,250,0.25), rgba(251,146,60,0.25))',
          border: '1px solid rgba(167,139,250,0.4)',
          boxShadow: '0 0 12px rgba(167,139,250,0.3)',
        }}
      >
        <span className="text-lg">⚡</span>
        <span className="text-white/90">一键合并</span>
        {match3Count > 0 && (
          <span className="rounded-full bg-pink-500/30 px-2 py-0.5 text-[10px] font-mono text-pink-300">
            3连×{match3Count}
          </span>
        )}
      </button>
    </div>
  )
}
