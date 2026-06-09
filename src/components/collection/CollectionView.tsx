/**
 * 图鉴：4 主题进度展示
 */
import { useState } from 'react'
import { useGameStore } from '@/store/gameStore'
import { ZONES, ZONE_LIST, type ZoneId, type Zone } from '@/data/emoji-trees'
import { levelToTier } from '@/lib/merge-engine'

const TIER_CLASS = ['tier-common', 'tier-rare', 'tier-epic', 'tier-legend']

export function CollectionView() {
  const collection = useGameStore(s => s.collection)
  const zoneMax = useGameStore(s => s.zoneMax)
  const [selected, setSelected] = useState<ZoneId>('creature')

  const totalUnlocked = Object.values(collection).reduce((s, arr) => s + arr.length, 0)
  const total = 11 * 4

  return (
    <div className="flex w-full max-w-[420px] flex-col gap-3 px-3 py-2">
      {/* 总进度 */}
      <div className="glass rounded-2xl p-3">
        <div className="mb-1 flex items-center justify-between text-xs">
          <span className="text-white/60">🌍 四界图鉴</span>
          <span className="font-mono text-gold-400">{totalUnlocked}/{total}</span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-white/5">
          <div
            className="level-bar h-full transition-all"
            style={{ width: `${(totalUnlocked / total) * 100}%` }}
          />
        </div>
      </div>

      {/* 主题选择 */}
      <div className="grid grid-cols-4 gap-2">
        {ZONE_LIST.map(z => {
          const unlocked = collection[z.id].length
          const isSelected = selected === z.id
          return (
            <button
              key={z.id}
              onClick={() => setSelected(z.id)}
              className={`touch-target flex flex-col items-center gap-0.5 rounded-xl py-2 text-xs transition-all ${
                isSelected ? 'ring-2 ring-gold-400' : 'ring-1 ring-white/10'
              }`}
              style={{
                background: isSelected ? z.bg : 'rgba(255,255,255,0.03)',
              }}
            >
              <span className="text-xl">{z.icon}</span>
              <span className="text-[10px] text-white/80">{z.name}</span>
              <span className="font-mono text-[9px] text-white/40">{unlocked}/11</span>
            </button>
          )
        })}
      </div>

      {/* 树视图 */}
      <ZoneTree zone={ZONES[selected]} unlocked={collection[selected] || []} max={zoneMax[selected]} />
    </div>
  )
}

function ZoneTree({ zone, unlocked, max }: { zone: Zone; unlocked: number[]; max: number }) {
  return (
    <div className="glass rounded-2xl p-3">
      <div className="mb-2 flex items-center gap-2">
        <span className="text-2xl">{zone.icon}</span>
        <div>
          <div className="text-sm font-semibold text-white/90">{zone.name}</div>
          <div className="text-[10px] text-white/40">{zone.subtitle}</div>
        </div>
        <div className="ml-auto rounded-full px-2 py-0.5 text-[10px] font-mono"
          style={{ background: zone.bg, color: zone.color }}>
          Lv.{max} / 11
        </div>
      </div>
      <div className="grid grid-cols-11 gap-1.5">
        {zone.tree.map(node => {
          const got = unlocked.includes(node.level)
          const tier = levelToTier(node.level)
          return (
            <div
              key={node.level}
              className={`relative flex aspect-square items-center justify-center rounded-lg text-base ${
                got ? TIER_CLASS[tier] : 'bg-white/[0.02] ring-1 ring-white/5 opacity-30'
              }`}
              title={`${node.name} Lv.${node.level}${got ? '' : ' (未解锁)'}`}
            >
              <span>{got ? node.emoji : '?'}</span>
              <span className="absolute bottom-0 right-0.5 text-[7px] font-mono text-white/50">
                {node.level}
              </span>
            </div>
          )
        })}
      </div>
      <div className="mt-2 text-[10px] text-white/30">
        💡 在「主页」切换到 {zone.name}，扭蛋 → 合成 → 解锁更多
      </div>
    </div>
  )
}
