/**
 * 合成 Tab：专注 4×4 网格 + 拖拽 + 历史 + v1.2 quick pull + v2.0 死局
 */
import { useState } from 'react'
import { MergeGrid } from '@/components/grid/MergeGrid'
import { Gashapon } from '@/components/gashapon/Gashapon'
import { DeadlockPanel } from '@/components/ui/DeadlockPanel'
import { useGameStore } from '@/store/gameStore'
import { ZONES, MAX_LEVEL } from '@/data/emoji-trees'

export function MergeTab() {
  const mergeCount = useGameStore(s => s.mergeCount)
  const bestCombo = useGameStore(s => s.bestCombo)
  const totalPulls = useGameStore(s => s.totalPulls)
  const maxLevel = useGameStore(s => s.maxLevel)
  const coins = useGameStore(s => s.coins)
  const currentZone = useGameStore(s => s.currentZone)
  const collection = useGameStore(s => s.collection)
  const pull = useGameStore(s => s.pull)
  const [showMachine, setShowMachine] = useState(false)

  const zone = ZONES[currentZone]
  const col = collection[currentZone] ?? []
  const progressPct = Math.round((col.length / MAX_LEVEL) * 100)

  return (
    <div className="flex w-full flex-col items-center gap-3 px-3 py-2">
      <div className="grid w-full max-w-[400px] grid-cols-4 gap-2 text-center text-xs">
        <Stat label="合成次数" value={mergeCount} />
        <Stat label="最高连击" value={bestCombo} />
        <Stat label="累计抽数" value={totalPulls} />
        <Stat label="最高 Lv." value={maxLevel} />
      </div>

      {/* v2.0 死局提示卡 */}
      <DeadlockPanel />

      {/* v1.2 主题进度 + 快捷抽卡 */}
      <div
        className="w-full max-w-[400px] rounded-2xl p-3"
        style={{
          background: zone.bg,
          border: `1px solid ${zone.color}44`,
        }}
      >
        <div className="flex items-center gap-2.5">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-xl text-xl"
            style={{ background: 'rgba(255,255,255,0.06)' }}
          >
            {zone.icon}
          </div>
          <div className="flex-1 leading-tight">
            <div className="text-sm font-bold" style={{ color: zone.color }}>
              {zone.name}
            </div>
            <div className="text-[10px] text-white/50">
              已收集 <span className="font-mono text-white/80">{col.length}/{MAX_LEVEL}</span>
            </div>
            <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-white/5">
              <div
                className="h-full transition-all duration-500"
                style={{
                  width: `${progressPct}%`,
                  background: `linear-gradient(90deg, ${zone.color}, ${zone.glow})`,
                }}
              />
            </div>
          </div>
          <button
            onClick={() => setShowMachine(s => !s)}
            className="touch-target rounded-full bg-white/10 px-2.5 py-1.5 text-[10px] font-bold text-white/80 active:scale-95"
            style={{ border: `1px solid ${zone.color}55` }}
          >
            {showMachine ? '收起' : '🎰 扭蛋机'}
          </button>
        </div>
        {showMachine && (
          <div className="mt-3 rounded-xl bg-black/30 p-2 -mx-1">
            <Gashapon onPulled={(count) => pull(count)} />
          </div>
        )}
      </div>

      <MergeGrid />
    </div>
  )
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="glass rounded-xl py-2">
      <div className="font-mono text-base font-bold text-gold-400">{value}</div>
      <div className="text-[10px] text-white/40">{label}</div>
    </div>
  )
}

