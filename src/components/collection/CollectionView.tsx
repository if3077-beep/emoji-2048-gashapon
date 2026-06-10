/**
 * 图鉴 v11.0 重做：本地故事 + 4 段结构化 + 主动在线入口
 * - 默认展示 4 段（背景/冷知识/合成链/关联），不调任何外网 API
 * - 末尾 "🌐 试试在线" 按钮：用户主动点击才 fetch，失败不弹窗
 * - 故事卡片头部 emoji 大字 + tier 徽章
 * - 关闭：点遮罩 / ESC 键
 */
import { useState, useEffect, useMemo } from 'react'
import { useGameStore } from '@/store/gameStore'
import { useUiStore } from '@/store/uiStore'
import { ZONES, ZONE_LIST, type ZoneId, type Zone, MAX_LEVEL } from '@/data/emoji-trees'
import { levelToTier } from '@/lib/merge-engine'
import { getSeason, seasonEmoji } from '@/lib/season'
import { getLocalStory, getRecommendedZone, getRandomStoryTarget, type LocalStory } from '@/lib/zone-story'
import { fetchOnline, type OnlineStory } from '@/lib/wiki'

const TIER_CLASS = ['tier-common', 'tier-rare', 'tier-epic', 'tier-legend']
const TIER_LABEL = ['普通', '稀有', '史诗', '传说']
const TIER_COLOR = ['#94a3b8', '#a78bfa', '#f0abfc', '#fbbf24']

export function CollectionView() {
  const collection = useGameStore(s => s.collection)
  const zoneMax = useGameStore(s => s.zoneMax)
  const readZones = useUiStore(s => s.readZones)
  const favoriteZones = useUiStore(s => s.favoriteZones)
  const [selected, setSelected] = useState<ZoneId>('creature')
  const [previewLevel, setPreviewLevel] = useState<number | null>(null)

  const totalUnlocked = Object.values(collection).reduce((s, arr) => s + arr.length, 0)
  const total = MAX_LEVEL * ZONE_LIST.length
  const totalRead = (readZones ?? []).length
  const totalFav = (favoriteZones ?? []).length

  const previewNode = previewLevel !== null ? ZONES[selected].tree.find(n => n.level === previewLevel) : null

  // v11.1 ESC 关闭预览
  useEffect(() => {
    if (previewNode === null) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setPreviewLevel(null)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [previewNode])

  // v11.1 ←→ 快捷键切换 zone
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // 弹层打开时不响应 ←→
      if (previewNode !== null) return
      // 输入框/textarea 不响应
      const tag = (e.target as HTMLElement)?.tagName
      if (['INPUT', 'TEXTAREA'].includes(tag)) return
      const idx = ZONE_LIST.findIndex(z => z.id === selected)
      if (e.key === 'ArrowRight') {
        e.preventDefault()
        const next = ZONE_LIST[(idx + 1) % ZONE_LIST.length]
        setSelected(next.id)
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault()
        const prev = ZONE_LIST[(idx - 1 + ZONE_LIST.length) % ZONE_LIST.length]
        setSelected(prev.id)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [selected, previewNode])

  return (
    <div className="flex w-full max-w-[420px] flex-col gap-3 px-3 py-2">
      {/* 总进度 + 已读 + 收藏 */}
      <div className="glass rounded-2xl p-3">
        <div className="mb-1 flex items-center justify-between text-xs">
          <span className="text-white/60">🌍 12 界图鉴</span>
          <span className="font-mono text-gold-400">
            {totalUnlocked}/{total} · 📜{totalRead}/12 · ⭐{totalFav}/12
          </span>
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
          const isRead = (readZones ?? []).includes(z.id)
          const isFav = (favoriteZones ?? []).includes(z.id)
          return (
            <button
              key={z.id}
              onClick={() => setSelected(z.id)}
              className={`touch-target relative flex flex-col items-center gap-0.5 rounded-xl py-2 text-xs transition-all ${
                isSelected ? 'ring-2 ring-gold-400' : 'ring-1 ring-white/10'
              }`}
              style={{
                background: isSelected ? z.bg : 'rgba(255,255,255,0.03)',
              }}
            >
              {isRead && (
                <span className="absolute -right-1 -top-1 rounded-full bg-violet-500/80 px-1 text-[8px] font-bold text-white">📜</span>
              )}
              {isFav && (
                <span className="absolute -left-1 -top-1 text-[10px]">⭐</span>
              )}
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
          onJump={(zoneId: ZoneId, level: number) => {
            setSelected(zoneId)
            setPreviewLevel(level)
          }}
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
        💡 点击已解锁的 emoji 查看故事 · 4 段结构化本地故事
      </div>
    </div>
  )
}

function NodePreview({ node, zone, onClose, onJump }: { node: any; zone: Zone; onClose: () => void; onJump?: (zoneId: ZoneId, level: number) => void }) {
  const setShareCard = useUiStore(s => s.setShareCard)
  const openShare = useUiStore(s => s.openShare)
  const addReadZone = useUiStore(s => s.addReadZone)
  const favoriteZones = useUiStore(s => s.favoriteZones)
  const toggleFavorite = useUiStore(s => s.toggleFavorite)
  const addCoins = useGameStore(s => s.addCoins)
  const isShareable = node.level >= 10
  const season = getSeason()
  const isFav = favoriteZones.includes(zone.id)

  // v11.0 故事数据：默认本地（瞬时返回，0 loading）
  const story = useMemo<LocalStory>(
    () => getLocalStory(node.emoji, zone.id, node.level, node.name),
    [node.emoji, zone.id, node.level, node.name],
  )
  // v11.1 首次阅读奖励：只在该 zone 未读过时给
  const readZones = useUiStore(s => s.readZones)
  const firstTimeReward = !(readZones ?? []).includes(zone.id)
  const tier = levelToTier(node.level)

  // v11.1 关弹窗时记录已读 + 首次奖励（v11.3 修：React 18 严格模式 dev 双 mount → 双倍币；改成查 store 再决定）
  useEffect(() => {
    const wasRead = useUiStore.getState().readZones.includes(zone.id)
    if (!wasRead) {
      useUiStore.getState().addReadZone(zone.id)
      addCoins(5)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div
        className="flex max-h-[88vh] w-[88vw] max-w-md flex-col gap-3 overflow-y-auto rounded-3xl p-5"
        style={{
          background: 'linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.02))',
          border: `1px solid ${zone.color}55`,
          boxShadow: `0 0 30px ${zone.glow}`,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 头部 */}
        <div className="flex items-start gap-3">
          <div className="text-5xl">{node.emoji}</div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <div className="text-base font-bold" style={{ color: zone.color }}>
                {node.name}
              </div>
              <span
                className="rounded-full px-1.5 py-0.5 text-[8px] font-bold"
                style={{ background: `${TIER_COLOR[tier]}33`, color: TIER_COLOR[tier] }}
              >
                {TIER_LABEL[tier]}
              </span>
            </div>
            <div className="mt-0.5 text-[10px] text-white/40">Lv.{node.level} · {zone.name}</div>
            <div className="mt-1 text-[10px] leading-relaxed text-white/60">{node.desc}</div>
          </div>
        </div>

        <div className="text-[9px] text-white/30">
          {seasonEmoji(season)} 当前 {zone.name} 享受 {node.level >= 11 ? '觉醒' : '基础'} 合成奖励
        </div>

        {/* v11.0 故事 4 段结构化 */}
        <div
          className="rounded-2xl p-3"
          style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(167,139,250,0.25)' }}
        >
          {/* 来源徽章（v11.0 唯一 chip：本地） */}
          <div className="mb-2 flex items-center gap-1.5 text-[9px] text-white/40">
            <span className="rounded-full bg-violet-500/20 px-1.5 py-0.5 font-bold text-violet-200">
              📚 本地故事
            </span>
          </div>

          {/* 1) 背景 */}
          <div className="space-y-0.5">
            <div className="text-[10px] font-bold text-white/70">📜 背景</div>
            <div className="text-[10px] leading-relaxed text-white/75">
              {story.sections.background}
            </div>
          </div>

          {/* 2) 冷知识 */}
          {story.sections.trivia && (
            <div className="mt-2 space-y-0.5 border-t border-white/5 pt-2">
              <div className="text-[10px] font-bold text-white/70">✨ 你知道吗</div>
              <div className="text-[10px] leading-relaxed text-white/75">
                {story.sections.trivia}
              </div>
            </div>
          )}

          {/* 3) 合成链 */}
          {story.sections.chain && (
            <div className="mt-2 space-y-0.5 border-t border-white/5 pt-2">
              <div className="text-[10px] font-bold text-white/70">🔗 合成链</div>
              <div className="flex items-center gap-1.5 text-[10px] text-white/75">
                <span className="font-mono">Lv.{node.level}</span>
                <span>{node.emoji}</span>
                <span className="text-violet-300">→</span>
                <span className="font-mono">Lv.{node.level + 1}</span>
                <span className="text-base">{story.sections.chain.nextEmoji}</span>
                <span className="text-white/80">{story.sections.chain.nextName}</span>
              </div>
              <div className="text-[9px] text-white/40">{story.sections.chain.hint}</div>
            </div>
          )}

          {/* 4) 关联 zone */}
          {story.sections.related.length > 0 && (
            <div className="mt-2 space-y-0.5 border-t border-white/5 pt-2">
              <div className="text-[10px] font-bold text-white/70">🌐 关联主题</div>
              {story.sections.related.map(r => {
                const linkZone = ZONES[r.to]
                return (
                  <div key={r.to} className="flex items-start gap-1.5 text-[10px] text-white/70">
                    <span className="text-base">{linkZone?.icon ?? '🌍'}</span>
                    <div>
                      <div style={{ color: linkZone?.color }} className="font-bold">{linkZone?.name ?? r.to}</div>
                      <div className="text-[9px] text-white/50">{r.reason}</div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* 节日特辑（v11.2） */}
          {story.sections.festival && (
            <div className="mt-2 space-y-0.5 border-t border-white/5 pt-2">
              <div className="text-[10px] font-bold text-amber-300">🎉 节日特辑</div>
              <div className="text-[10px] leading-relaxed text-amber-100/80">
                {story.sections.festival}
              </div>
            </div>
          )}
        </div>

        {/* v11.0 在线入口（次要、低饱和） */}
        <OnlineFallbackButton name={node.name} zone={zone.id} />

        {firstTimeReward && (
          <div className="rounded-full bg-violet-500/20 py-1 text-center text-[10px] font-bold text-violet-200 ring-1 ring-violet-400/30">
            🎁 首次阅读本主题 · +5🪙（已发放）
          </div>
        )}

        {/* v11.1 收藏按钮 */}
        <button
          onClick={() => toggleFavorite(zone.id)}
          className="touch-target w-full rounded-full bg-white/5 py-1.5 text-[11px] font-bold text-white/80 ring-1 ring-white/10 active:scale-95"
        >
          {isFav ? '⭐ 已收藏本主题' : '☆ 收藏本主题'}
        </button>

        {/* v11.2 随机 + 跨区推荐 */}
        {onJump && (
          <div className="flex gap-2">
            <button
              onClick={() => {
                const t = getRandomStoryTarget()
                onJump(t.zone, t.level)
              }}
              className="touch-target flex-1 rounded-full bg-violet-500/20 py-1.5 text-[11px] font-bold text-violet-200 ring-1 ring-violet-400/30 active:scale-95"
              title="跳到随机一个主题/等级的未读故事"
            >
              🎲 随机故事
            </button>
            {(() => {
              const link = getRecommendedZone(zone.id)
              if (!link) return null
              const linkZone = ZONES[link.to]
              return (
                <button
                  onClick={() => onJump(link.to, 1)}
                  className="touch-target flex-1 rounded-full bg-cyan-500/20 py-1.5 text-[11px] font-bold text-cyan-200 ring-1 ring-cyan-400/30 active:scale-95"
                  title={link.reason}
                >
                  → {linkZone?.icon} {linkZone?.name ?? link.to}
                </button>
              )
            })()}
          </div>
        )}

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
        <button onClick={onClose} className="text-[10px] text-white/40 underline self-center">关闭（ESC）</button>
      </div>
    </div>
  )
}

/** v11.0 在线入口：点击才 fetch，失败静默 + 5s 后自动隐藏 */
function OnlineFallbackButton({ name, zone }: { name: string; zone: ZoneId }) {
  const [online, setOnline] = useState<OnlineStory | null>(null)
  const [loading, setLoading] = useState(false)
  const [failed, setFailed] = useState(false)
  const click = async () => {
    if (loading) return
    setLoading(true)
    const r = await fetchOnline(name, zone)
    setLoading(false)
    if (r) {
      setOnline(r)
    } else {
      // 失败：静默，5s 后自动隐藏按钮
      setFailed(true)
      setTimeout(() => setFailed(false), 5000)
    }
  }
  if (online) {
    return (
      <div className="rounded-2xl bg-black/30 p-2 text-[10px] text-white/65 ring-1 ring-violet-400/15">
        <div className="mb-1 flex items-center gap-1.5 text-[9px] text-white/40">
          <span className="rounded-full bg-violet-500/20 px-1.5 py-0.5 font-bold text-violet-200">
            {online.source === 'wiki' ? '🌐 在线' : '🍽️ 菜谱'}
          </span>
          {online.url && <a href={online.url} target="_blank" rel="noreferrer" className="underline-offset-2 hover:underline">↗ 打开</a>}
        </div>
        <div className="text-[10px] font-bold text-white/80">{online.title}</div>
        <div className="mt-0.5 text-[9px] leading-relaxed text-white/60 line-clamp-3">{online.extract}</div>
      </div>
    )
  }
  if (failed) return null  // 5s 内静默
  return (
    <button
      onClick={click}
      disabled={loading}
      className="text-[9px] text-white/30 underline-offset-2 hover:underline disabled:opacity-50"
    >
      {loading ? '…' : '🌐 试试在线百科（可能加载不出）'}
    </button>
  )
}
