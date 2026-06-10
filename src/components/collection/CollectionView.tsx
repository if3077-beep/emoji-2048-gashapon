/**
 * 图鉴 v0.6 改造：12 主题 + 收藏展示墙
 * - 点击大图查看故事 + 分享
 * - v6.1 增加异步故事/菜谱（Wikipedia + TheMealDB）
 */
import { useState, useEffect } from 'react'
import { useGameStore } from '@/store/gameStore'
import { useUiStore } from '@/store/uiStore'
import { ZONES, ZONE_LIST, type ZoneId, type Zone, MAX_LEVEL } from '@/data/emoji-trees'
import { levelToTier } from '@/lib/merge-engine'
import { getSeason, seasonEmoji } from '@/lib/season'
import { fetchStory, type StoryResult } from '@/lib/wiki'

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
  const isFood = ['food', 'ocean'].includes(zone.id)
  // v6.1 异步故事/菜谱
  const [story, setStory] = useState<StoryResult | null>(null)
  const [loading, setLoading] = useState(false)
  // v8.0 离线提示
  const [offlineToast, setOfflineToast] = useState(false)
  const loadStory = async () => {
    if (story || loading) return
    setLoading(true)
    const r = await fetchStory(node.emoji, zone.id, node.name, node.level)
    setStory(r)
    setLoading(false)
    if (r.offline) {
      setOfflineToast(true)
      setTimeout(() => setOfflineToast(false), 1500)
    }
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      {/* v8.0 离线 toast 浮层 */}
      {offlineToast && (
        <div className="pointer-events-none fixed left-1/2 top-12 z-50 -translate-x-1/2 animate-pop">
          <div className="rounded-full bg-amber-500/30 px-3 py-1 text-[11px] font-bold text-amber-200 backdrop-blur-sm" style={{ border: '1px solid rgba(245,158,11,0.5)' }}>
            📴 国内环境，API 暂不可用，已用本地故事
          </div>
        </div>
      )}
      <div
        className="flex w-[88vw] max-w-md flex-col gap-3 rounded-3xl p-5"
        style={{
          background: 'linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.02))',
          border: `1px solid ${zone.color}55`,
          boxShadow: `0 0 30px ${zone.glow}`,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3">
          <div className="text-6xl">{node.emoji}</div>
          <div className="flex-1">
            <div className="text-base font-bold" style={{ color: zone.color }}>
              {node.name}
            </div>
            <div className="mt-0.5 text-[10px] text-white/40">Lv.{node.level} · {zone.name}</div>
            <div className="mt-1 text-[10px] leading-relaxed text-white/60">{node.desc}</div>
          </div>
        </div>

        <div className="text-[9px] text-white/30">
          {seasonEmoji(season)} 当前 {zone.name} 享受 {node.level >= 11 ? '觉醒' : '基础'} 合成奖励
        </div>

        {/* v6.1 故事/菜谱区 */}
        <div
          className="rounded-2xl p-3"
          style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(167,139,250,0.25)' }}
        >
          {!story && !loading && (
            <div className="flex gap-2">
              <button
                onClick={loadStory}
                className="touch-target flex-1 rounded-full bg-violet-500/25 py-1.5 text-[11px] font-bold text-violet-200 ring-1 ring-violet-400/30 active:scale-95"
                title="来自 Wikipedia 中文摘要"
              >
                📖 {isFood ? '故事' : '查看百科'}
              </button>
              {isFood && (
                <button
                  onClick={loadStory}
                  className="touch-target flex-1 rounded-full bg-rose-500/25 py-1.5 text-[11px] font-bold text-rose-200 ring-1 ring-rose-400/30 active:scale-95"
                  title="TheMealDB 菜谱"
                >
                  🍽️ 看菜谱
                </button>
              )}
            </div>
          )}
          {loading && (
            <div className="flex items-center gap-2 text-[11px] text-white/50">
              <div className="h-3 w-3 animate-spin rounded-full border-2 border-violet-400 border-t-transparent" />
              正在从 Wikipedia 加载…
            </div>
          )}
          {story && (
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5 text-[9px] text-white/40">
                <span className="rounded-full bg-violet-500/20 px-1.5 py-0.5 font-bold text-violet-200">
                  {story.source === 'wiki' ? '📖 Wikipedia' : story.source === 'meal' ? '🍽️ TheMealDB' : story.offline ? '📚 本地' : '📚 Local'}
                </span>
                {story.offline && (
                  <span className="rounded-full bg-amber-500/20 px-1.5 py-0.5 font-bold text-amber-200">
                    📴 离线
                  </span>
                )}
                {story.url && (
                  <a
                    href={story.url}
                    target="_blank"
                    rel="noreferrer"
                    className="underline-offset-2 hover:underline"
                  >
                    ↗ 打开
                  </a>
                )}
              </div>
              <div className="text-[11px] font-bold text-white/80">{story.title}</div>
              <div className="text-[10px] leading-relaxed text-white/65">{story.extract}</div>
              {story.thumbnail && (
                <img
                  src={story.thumbnail}
                  alt={story.title}
                  className="mt-1 max-h-32 w-full rounded-xl object-cover"
                  loading="lazy"
                  referrerPolicy="no-referrer"
                />
              )}
            </div>
          )}
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
          <div className="text-[10px] text-white/30 text-center">达到 Lv.10 即可分享</div>
        )}
        <button onClick={onClose} className="text-[10px] text-white/40 underline self-center">关闭</button>
      </div>
    </div>
  )
}
