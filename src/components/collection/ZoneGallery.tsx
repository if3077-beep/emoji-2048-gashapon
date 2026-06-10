/**
 * 主题画廊弹层（v0.2）
 * 8 大生态区三态：未解锁 / 探索中 / 已通关
 * 替代主页堆 8 个按钮 → 主页只显示当前主题，主题切换走弹层
 */
import { useEffect } from 'react'
import gsap from 'gsap'
import { ZONE_LIST, getLevelLabel, MAX_LEVEL } from '@/data/emoji-trees'
import { useGameStore } from '@/store/gameStore'
import { useUiStore } from '@/store/uiStore'

type ZoneState = 'locked' | 'exploring' | 'cleared'

function getZoneState(maxLevel: number): ZoneState {
  if (maxLevel === 0) return 'locked'
  if (maxLevel >= MAX_LEVEL) return 'cleared'
  return 'exploring'
}

const STATE_LABEL: Record<ZoneState, { text: string; color: string }> = {
  locked:    { text: '🔒 未解锁', color: 'text-white/30' },
  exploring: { text: '🧭 探索中', color: 'text-gold-400' },
  cleared:   { text: '✅ 已通关', color: 'text-emerald-400' },
}

export function ZoneGallery() {
  const show = useUiStore(s => s.showZoneGallery)
  const close = useUiStore(s => s.closeZoneGallery)
  const currentZone = useGameStore(s => s.currentZone)
  const setZone = useGameStore(s => s.setZone)
  const zoneMax = useGameStore(s => s.zoneMax)
  const collection = useGameStore(s => s.collection)
  const setGuide = useUiStore(s => s.setGuide)

  useEffect(() => {
    if (show) {
      gsap.fromTo(
        '.zone-card',
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.35, stagger: 0.04, ease: 'power2.out' },
      )
    }
  }, [show])

  if (!show) return null

  const onPick = (zid: typeof currentZone) => {
    // v7.2 主题切换过场：先径向覆盖 0.3s，再切 zone
    const z = ZONE_LIST.find(zz => zz.id === zid)
    if (z) {
      const overlay = document.createElement('div')
      overlay.className = 'pointer-events-none fixed inset-0 z-[60]'
      overlay.style.cssText = `background:radial-gradient(circle, ${z.color}aa 0%, ${z.color}55 40%, transparent 80%);opacity:0;`
      document.body.appendChild(overlay)
      gsap.to(overlay, { opacity: 1, duration: 0.15, ease: 'power2.out', onComplete: () => {
        setZone(zid)
        setGuide(`已切换到 ${z.name}`)
        gsap.to(overlay, { opacity: 0, duration: 0.18, delay: 0.05, ease: 'power2.in', onComplete: () => overlay.remove() })
        // v7.2 震动反馈
        try { navigator.vibrate?.(15) } catch {}
      } })
    } else {
      setZone(zid)
      setGuide('已切换主题')
    }
    close()
  }

  return (
    <div
      className="fixed inset-0 z-40 flex items-end justify-center bg-black/60 backdrop-blur-sm sm:items-center"
      onClick={close}
    >
      <div
        className="relative flex h-[85vh] w-full max-w-[440px] flex-col glass-strong rounded-t-3xl sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 标题栏 */}
        <div className="flex items-center justify-between px-5 py-4">
          <div>
            <div className="text-base font-bold text-white/90">🗺️ 主题画廊</div>
            <div className="mt-0.5 text-[10px] text-white/40">选择要探索的生态区</div>
          </div>
          <button
            onClick={close}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white/5 text-white/60 active:scale-95"
            aria-label="关闭"
          >
            ✕
          </button>
        </div>

        {/* 列表 */}
        <div className="flex-1 overflow-y-auto px-4 pb-6 scrollbar-hidden">
          <div className="grid grid-cols-2 gap-3">
            {ZONE_LIST.map(z => {
              const max = zoneMax[z.id] ?? 0
              const state = getZoneState(max)
              const stateInfo = STATE_LABEL[state]
              const col = collection[z.id] ?? []
              const progressPct = Math.round((col.length / MAX_LEVEL) * 100)
              const isCurrent = z.id === currentZone
              return (
                <button
                  key={z.id}
                  onClick={() => onPick(z.id)}
                  className="zone-card group relative flex flex-col items-start gap-2 rounded-2xl p-3 text-left transition-all active:scale-[0.97]"
                  style={{
                    background: isCurrent ? z.bg : 'rgba(255,255,255,0.04)',
                    border: `1px solid ${isCurrent ? z.color : 'rgba(255,255,255,0.06)'}`,
                    boxShadow: isCurrent ? `0 0 18px ${z.glow}` : 'none',
                  }}
                >
                  {/* 当前主题标记 */}
                  {isCurrent && (
                    <span
                      className="absolute -top-1.5 -right-1.5 rounded-full px-1.5 py-0.5 text-[9px] font-bold"
                      style={{ background: z.color, color: '#0e0c0a' }}
                    >
                      当前
                    </span>
                  )}
                  <div className="flex w-full items-center gap-2">
                    <div
                      className="flex h-10 w-10 items-center justify-center rounded-xl text-2xl"
                      style={{ background: 'rgba(255,255,255,0.06)' }}
                    >
                      {z.icon}
                    </div>
                    <div className="flex-1 leading-tight">
                      <div className="text-sm font-bold" style={{ color: z.color }}>
                        {z.name}
                      </div>
                      <div className="text-[9px] text-white/40">{z.subtitle}</div>
                    </div>
                  </div>

                  {/* v1.1 主题故事（一句话简介） */}
                  <div className="text-[9px] leading-snug text-white/45 line-clamp-2">
                    {z.description}
                  </div>

                  <div className="flex w-full items-center justify-between text-[10px]">
                    <span className={stateInfo.color}>{stateInfo.text}</span>
                    <span className="font-mono text-white/40">
                      {max === 0 ? '未开始' : getLevelLabel(max)}
                    </span>
                  </div>

                  <div className="h-1 w-full overflow-hidden rounded-full bg-white/5">
                    <div
                      className="h-full transition-all"
                      style={{
                        width: `${progressPct}%`,
                        background: state === 'cleared'
                          ? 'linear-gradient(90deg, #86efac, #a3e635)'
                          : `linear-gradient(90deg, ${z.color}, ${z.color}88)`,
                      }}
                    />
                  </div>
                  <div className="flex w-full items-center justify-between text-[9px] text-white/30">
                    <span>收集 {col.length}/{MAX_LEVEL}</span>
                    {state === 'cleared' && <span>觉醒·{z.awakenedEmoji}</span>}
                  </div>
                </button>
              )
            })}
          </div>

          <div className="mt-4 rounded-2xl bg-white/[0.03] p-3 text-[10px] leading-relaxed text-white/50">
            <div className="mb-1 font-bold text-white/70">💡 提示</div>
            <div>· 通关一区（合成至 Lv.11）后，可在该区继续挑战"觉醒"循环（Ⅰ→Ⅱ→Ⅲ…无限）</div>
            <div>· 切换主题会改变扭蛋机的图鉴池，但已收集的记录都保留</div>
            <div>· 你的小宠物会根据你停留最久的区进化颜色</div>
          </div>
        </div>
      </div>
    </div>
  )
}
