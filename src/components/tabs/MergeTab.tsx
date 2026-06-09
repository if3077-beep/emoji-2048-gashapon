/**
 * 合成 Tab：专注 4×4 网格 + 拖拽 + 历史
 */
import { MergeGrid } from '@/components/grid/MergeGrid'
import { useGameStore } from '@/store/gameStore'

export function MergeTab() {
  const mergeCount = useGameStore(s => s.mergeCount)
  const bestCombo = useGameStore(s => s.bestCombo)
  const totalPulls = useGameStore(s => s.totalPulls)
  const maxLevel = useGameStore(s => s.maxLevel)

  return (
    <div className="flex w-full flex-col items-center gap-3 px-3 py-2">
      <div className="grid w-full max-w-[400px] grid-cols-4 gap-2 text-center text-xs">
        <Stat label="合成次数" value={mergeCount} />
        <Stat label="最高连击" value={bestCombo} />
        <Stat label="累计抽数" value={totalPulls} />
        <Stat label="最高 Lv." value={maxLevel} />
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
