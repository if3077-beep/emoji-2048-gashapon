/**
 * 图鉴 v0.6 改造：12 主题 + 收藏展示墙
 * - 点击大图查看故事 + 分享
 */
import { useState } from 'react'
import { useGameStore } from '@/store/gameStore'
import { useUiStore } from '@/store/uiStore'
import { ZONES, ZONE_LIST, type ZoneId, type Zone, MAX_LEVEL } from '@/data/emoji-trees'
import { levelToTier } from '@/lib/merge-engine'
import { getSeason, seasonEmoji } from '@/lib/season'

const TIER_CLASS = ['tier-common', 'tier-rare', 'tier-epic', 'tier-legend']

export function CollectionView() {
  const collection = useGameStore(s => s.collection)
  const zoneMax = useGameStore(s => s.zoneMax)
  const [selected, setSelected] = useState<ZoneId>('creature')
  const [previewLevel, setPreviewLevel] = useState<number | null>(null)

  const totalUnlocked = Object.values(collection).reduce((s, arr) => s + arr.length, 0)
  const total = MAX_LEVEL * ZONE_LIST.length

  const previewNode = previewLevel !== null ? ZONES[selected].tree.find(n => n.level === previewLevel) : null

  return (
    <div className="flex w-full max-w-[420px] flex-col gap-3 px-3 py-2">
      {/* 总进度 */}
      <div className="glass rounded-2xl p-3">
        <div className="mb-1 flex items-center justify-between text-xs">
          <span className="text-white/60">🌍 12 界图鉴</span>
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
              <span className="font-mono text-[9px] text-white/40">{unlocked}/{MAX_LEVEL}</span>
            </button>
          )
        })}
      </div>

      {/* 树视图 */}
      <ZoneTree zone={ZONES[selected]} unlocked={collection[selected] || []} max={zoneMax[selected]} onPreview={setPreviewLevel} />

      {/* 弹层预览 */}
      {previewNode && (
        <NodePreview
          node={previewNode}
          zone={ZONES[selected]}
          onClose={() => setPreviewLevel(null)}
        />
      )}
    </div>
  )
}

function ZoneTree({ zone, unlocked, max, onPreview }: { zone: Zone; unlocked: number[]; max: number; onPreview: (lv: number) => void }) {
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
          Lv.{max} / {MAX_LEVEL}
        </div>
      </div>
      <div className="grid grid-cols-6 gap-1.5">
        {zone.tree.map(node => {
          const got = unlocked.includes(node.level)
          const tier = levelToTier(node.level)
          return (
            <button
              key={node.level}
              onClick={() => got && onPreview(node.level)}
              className={`relative flex aspect-square items-center justify-center rounded-lg text-base ${
                got ? TIER_CLASS[tier] : 'bg-white/[0.02] ring-1 ring-white/5 opacity-30'
              }`}
              title={`${node.name} Lv.${node.level}${got ? '' : ' (未解锁)'}`}
            >
              <span>{got ? node.emoji : '?'}</span>
              <span className="absolute bottom-0 right-0.5 text-[7px] font-mono text-white/50">
                {node.level}
              </span>
            </button>
          )
        })}
      </div>
      <div className="mt-2 text-[10px] text-white/30">
        💡 点击已解锁的 emoji 查看故事 · Lv.10+ 可分享
      </div>
    </div>
  )
}

function NodePreview({ node, zone, onClose }: { node: any; zone: Zone; onClose: () => void }) {
  const setShareCard = useUiStore(s => s.setShareCard)
  const openShare = useUiStore(s => s.openShare)
  const isShareable = node.level >= 10
  const season = getSeason()

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div
        className="flex w-[300px] flex-col items-center gap-3 rounded-3xl p-5"
        style={{
          background: 'linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.02))',
          border: `1px solid ${zone.color}55`,
          boxShadow: `0 0 30px ${zone.glow}`,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-7xl">{node.emoji}</div>
        <div className="text-center">
          <div className="text-base font-bold" style={{ color: zone.color }}>
            {node.name}
          </div>
          <div className="mt-0.5 text-[10px] text-white/40">Lv.{node.level} · {zone.name}</div>
        </div>
        <div className="rounded-2xl bg-black/20 px-4 py-2 text-xs leading-relaxed text-white/70">
          {node.desc}
        </div>
        <div className="text-[9px] text-white/30">
          {seasonEmoji(season)} 当前 {zone.name} 享受 {node.level >= 11 ? '觉醒' : '基础'} 合成奖励
        </div>
        {isShareable ? (
          <button
            onClick={() => {
              setShareCard({ emoji: node.emoji, level: node.level, title: zone.name })
              openShare()
              onClose()
            }}
            className="touch-target w-full rounded-full bg-gradient-to-r from-gold-500 to-ember-500 py-2 text-sm font-bold text-ink-900 active:scale-95"
          >
            🖼️ 分享这张
          </button>
        ) : (
          <div className="text-[10px] text-white/30">达到 Lv.10 即可分享</div>
        )}
        <button onClick={onClose} className="text-[10px] text-white/40 underline">关闭</button>
      </div>
    </div>
  )
}
