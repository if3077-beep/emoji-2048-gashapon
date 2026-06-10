/**
 * 4×4 滑动合并网格（v0.2：方向滑动 + 滑入动效 + 觉醒支持）
 * - 上/下/左/右滑动 → 整行/列推动 → 自动合并
 * - 支持触屏和键盘方向键
 * - 滑动后给 merge-engine 跑一遍事件流
 */
import { useGameStore } from '@/store/gameStore'
import { useUiStore } from '@/store/uiStore'
import { ZONES, GRID_SIZE, getLevelLabel } from '@/data/emoji-trees'
import { sfx, resumeAudio } from '@/lib/audio'
import { levelToTier, type Grid, type Tile, findZoneMax, findBestHint } from '@/lib/merge-engine'
import { calcReward, getReward, type EventKind } from '@/lib/event-rewards'
import { useRef, useState, useCallback, useEffect } from 'react'
import gsap from 'gsap'
import { Dpad } from './Dpad'
import { detectMatch3 } from '@/lib/auto-merge'

const TIER_CLASS = ['tier-common', 'tier-rare', 'tier-epic', 'tier-legend']

const getEmoji = (t: Tile): string => {
  if (t.level <= 11) return ZONES[t.zone].tree[t.level - 1]?.emoji ?? '·'
  return ZONES[t.zone].awakenedEmoji
}

const getName = (t: Tile): string => {
  if (t.level <= 11) return ZONES[t.zone].tree[t.level - 1]?.name ?? '·'
  return ZONES[t.zone].awakenedName
}

type Dir = 'up' | 'down' | 'left' | 'right'

interface SlideState {
  active: boolean
  startX: number
  startY: number
  startT: number
}

export function MergeGrid() {
  const grid = useGameStore(s => s.grid)
  const slide = useGameStore(s => s.slide)
  const currentZone = useGameStore(s => s.currentZone)
  const combo = useGameStore(s => s.combo)
  const bestCombo = useGameStore(s => s.bestCombo)

  const pushToast = useUiStore(s => s.pushToast)
  const setGuide = useUiStore(s => s.setGuide)
  const pushBurst = useUiStore(s => s.pushBurst)
  const burstConfetti = useUiStore(s => s.burstConfetti)

  const [sliding, setSliding] = useState<SlideState>({ active: false, startX: 0, startY: 0, startT: 0 })
  const [animTiles, setAnimTiles] = useState<Set<string>>(new Set())
  const [lastDir, setLastDir] = useState<Dir | null>(null)  // v1.2 滑动方向轨迹
  // v2.2 提示：当前最佳方向 + 显示窗口期
  const [hintDir, setHintDir] = useState<Dir | null>(null)
  const [hintFlashAt, setHintFlashAt] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)
  const THRESHOLD = 28  // 触发滑动的最小距离

  const handleDirection = useCallback((dir: Dir, fromX: number, fromY: number) => {
    resumeAudio()
    setLastDir(dir)  // v1.2 记录最近滑动方向
    setTimeout(() => setLastDir(null), 400)
    const result = slide(dir)
    if (result.moves.length === 0) {
      // 滑动但无变化：断连击
      sfx.fail()
      return
    }
    // v1.2：弹动动画（缩放 + 轻微位移）+ 方向轨迹光带
    setTimeout(() => {
      if (!containerRef.current) return
      // 1) 移动过的 cell 做一次弹动
      const movedSet = new Set(result.moves.map(m => m.to.join(',')))
      const cells = containerRef.current.querySelectorAll('[data-cell]')
      cells.forEach(cell => {
        const pos = (cell as HTMLElement).dataset.cell
        if (pos && movedSet.has(pos)) {
          gsap.fromTo(
            cell,
            { scale: 0.85, y: dir === 'up' ? 8 : dir === 'down' ? -8 : 0, x: dir === 'left' ? 8 : dir === 'right' ? -8 : 0 },
            { scale: 1, x: 0, y: 0, duration: 0.36, ease: 'back.out(1.6)' },
          )
          // v3.0 移动轨迹闪绿光 ring（说明这一格是经过的位置）
          gsap.fromTo(
            cell,
            { boxShadow: '0 0 0 2px rgba(74,222,128,0.85), 0 0 12px rgba(74,222,128,0.55)' },
            { boxShadow: '0 0 0 0 rgba(74,222,128,0)', duration: 0.5, delay: 0.05, ease: 'power2.out' },
          )
        }
      })
      // 2) 合并位置额外做 ring 缩放（金色更亮）
      const mergeSet = new Set(result.events.map(e => e.pos.join(',')))
      cells.forEach(cell => {
        const pos = (cell as HTMLElement).dataset.cell
        if (pos && mergeSet.has(pos)) {
          gsap.fromTo(
            cell,
            { boxShadow: '0 0 0 5px rgba(251,191,36,1), 0 0 28px rgba(251,191,36,0.95)' },
            { boxShadow: '0 0 0 0 rgba(251,191,36,0)', duration: 0.65, ease: 'power2.out' },
          )
        }
      })
      // 3) v3.0 移动起止点连线：在 grid 上画一道金色连线（from → to）-- 用临时 SVG
      if (result.moves.length > 0 && containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect()
        const cellW = (rect.width - 24) / GRID_SIZE  // 24 = p-3 * 2
        const cellH = (rect.height - 24 - 50) / GRID_SIZE  // 扣掉 padding 和 dpad 行
        const svgNS = 'http://www.w3.org/2000/svg'
        const svg = document.createElementNS(svgNS, 'svg')
        svg.setAttribute('class', 'pointer-events-none absolute inset-3 z-20')
        svg.setAttribute('width', String(rect.width - 24))
        svg.setAttribute('height', String(rect.height - 24 - 50))
        const path = document.createElementNS(svgNS, 'path')
        const pts = result.moves.map(m => `${(m.to[1] + 0.5) * cellW},${(m.to[0] + 0.5) * cellH}`)
        path.setAttribute('d', `M ${pts.join(' L ')}`)
        path.setAttribute('stroke', 'rgba(251,191,36,0.85)')
        path.setAttribute('stroke-width', '2')
        path.setAttribute('fill', 'none')
        path.setAttribute('stroke-linecap', 'round')
        path.setAttribute('stroke-linejoin', 'round')
        path.setAttribute('stroke-dasharray', '4 3')
        svg.appendChild(path)
        containerRef.current.appendChild(svg)
        const totalLen = path.getTotalLength ? path.getTotalLength() : 200
        gsap.fromTo(path, { strokeDashoffset: totalLen }, { strokeDashoffset: 0, duration: 0.5, ease: 'power2.out' })
        gsap.to(svg, { opacity: 0, duration: 0.4, delay: 0.6, onComplete: () => svg.remove() })
      }
    }, 16)

    // 动画：先滑入标记，200ms 后清
    const moved = new Set(result.moves.map(m => m.tileId))
    setAnimTiles(moved)
    setTimeout(() => setAnimTiles(new Set()), 500)

    // 触发效果
    result.events.forEach((evt, i) => {
      setTimeout(() => {
        const reward = getReward(evt.kind)
        const finalAmount = (evt as any).finalReward ?? calcReward(evt.kind, { combo: combo + 1, affection: useGameStore.getState().pet?.affection ?? 0 }).final
        const isCrit = (evt as any).isCrit
        const isLucky = (evt as any).isLucky
        if (finalAmount > 0) {
          // 计算事件屏幕坐标
          const screen = eventScreenPos(evt.pos, containerRef.current)
          pushBurst({
            id: `burst_${Date.now()}_${i}`,
            amount: finalAmount,
            text: isCrit ? `💥 +${finalAmount.toLocaleString()}` : `+${finalAmount.toLocaleString()}`,
            emoji: isCrit ? '💥' : isLucky ? '🍀' : reward.emoji,
            intensity: isCrit ? 3 : reward.intensity,
            color: isCrit ? '#ef4444' : isLucky ? '#a3e635' : reward.color,
            x: screen.x,
            y: screen.y,
          })
          sfx.merge(evt.level)
          if (isCrit) sfx.crit()
          else if (evt.level >= 5) sfx.rare()
          if (evt.level === 11) sfx.celebrate()
          if (evt.level > 11) sfx.celebrate()
        }
        // v3.0 数字飘字：直接在合并 cell 上冒泡（额外反馈）
        if (containerRef.current) {
          const cell = containerRef.current.querySelector(`[data-cell="${evt.pos[0]},${evt.pos[1]}"]`) as HTMLElement | null
          if (cell) {
            const flyText = isCrit ? `💥 +${finalAmount}` : isLucky ? `🍀 +${finalAmount}` : `+${finalAmount}`
            const fly = document.createElement('div')
            fly.textContent = flyText
            fly.className = 'pointer-events-none absolute left-1/2 top-1/2 z-30 -translate-x-1/2 -translate-y-1/2 font-mono text-sm font-extrabold'
            fly.style.color = isCrit ? '#ef4444' : isLucky ? '#a3e635' : '#fde68a'
            fly.style.textShadow = '0 0 6px rgba(0,0,0,0.6), 0 0 12px currentColor'
            cell.appendChild(fly)
            gsap.fromTo(
              fly,
              { y: 0, scale: 0.6, opacity: 0 },
              { y: -34, scale: 1.3, opacity: 1, duration: 0.25, ease: 'back.out(1.7)' },
            )
            gsap.to(fly, { y: -56, opacity: 0, duration: 0.55, delay: 0.3, ease: 'power1.in', onComplete: () => fly.remove() })
          }
        }
        if (evt.kind === 'merge_mythic' || evt.kind === 'merge_epic') {
          // 升级射线
          burstConfetti()
        }
        if (evt.kind === 'merge_awaken' || evt.kind === 'merge_awaken_t5' || evt.kind === 'merge_awaken_t10') {
          burstConfetti()
          sfx.celebrate()
        }
        // 飘字
        const tile = grid[evt.pos[0]]?.[evt.pos[1]]
        if (tile) {
          const lvl = tile.level
          const tier = levelToTier(Math.min(lvl, 11))
          pushToast(
            isCrit ? `💥 暴击!` :
            isLucky ? `🍀 幸运!` :
            evt.kind === 'merge_first' ? `首合!${getName(tile)}` :
            evt.kind === 'merge_mythic' ? `神话·${getName(tile)}` :
            evt.kind === 'merge_epic' ? `史诗·${getName(tile)}` :
            evt.kind === 'merge_rare' ? `稀有·${getName(tile)}` :
            getLevelLabel(lvl),
            isCrit ? '💥' : isLucky ? '🍀' : getEmoji(tile),
            tier as any,
          )
        }
      }, i * 80)  // 错开爆发
    })
  }, [slide, combo, grid, pushToast, pushBurst, burstConfetti])

  // 触屏滑动
  const onTouchStart = (e: React.PointerEvent) => {
    setSliding({ active: true, startX: e.clientX, startY: e.clientY, startT: Date.now() })
  }
  const onTouchEnd = (e: React.PointerEvent) => {
    if (!sliding.active) return
    const dx = e.clientX - sliding.startX
    const dy = e.clientY - sliding.startY
    if (Math.abs(dx) < THRESHOLD && Math.abs(dy) < THRESHOLD) {
      setSliding({ active: false, startX: 0, startY: 0, startT: 0 })
      return
    }
    if (Math.abs(dx) > Math.abs(dy)) {
      handleDirection(dx > 0 ? 'right' : 'left', sliding.startX, sliding.startY)
    } else {
      handleDirection(dy > 0 ? 'down' : 'up', sliding.startX, sliding.startY)
    }
    setSliding({ active: false, startX: 0, startY: 0, startT: 0 })
  }

  // v2.2 "💡 提示"：算 best hint 方向并闪 1.5s
  const showHint = useCallback(() => {
    const h = findBestHint(grid)
    if (!h.dir) {
      pushToast('没有可合并的方向', '🪦', 1)
      return
    }
    setHintDir(h.dir)
    setHintFlashAt(Date.now())
    const dirText = h.dir === 'up' ? '上滑 ⬆️' : h.dir === 'down' ? '下滑 ⬇️' : h.dir === 'left' ? '左滑 ⬅️' : '右滑 ➡️'
    pushToast(`${dirText} · ${h.events} 合成`, '💡', 2)
    sfx.tap()
    setTimeout(() => setHintDir(null), 1500)
  }, [grid, pushToast])

  // v2.2：滑动后自动隐藏 hint
  useEffect(() => {
    setHintDir(null)
  }, [grid])

  // v0.8 3 连锁动：检测到 match3 → 整行整列高亮
  const match3Lines = detectMatch3(grid)

  // 键盘方向键
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return
      const map: Record<string, Dir> = {
        ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right',
        w: 'up', s: 'down', a: 'left', d: 'right',
        W: 'up', S: 'down', A: 'left', D: 'right',
      }
      const dir = map[e.key]
      if (dir) {
        e.preventDefault()
        const r = containerRef.current?.getBoundingClientRect()
        handleDirection(dir, (r?.left ?? 0) + (r?.width ?? 0) / 2, (r?.top ?? 0) + (r?.height ?? 0) / 2)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [handleDirection])

  return (
    <div
      ref={containerRef}
      className="relative w-full max-w-[360px] select-none rounded-2xl p-3 glass touch-target"
      onPointerDown={onTouchStart}
      onPointerUp={onTouchEnd}
      onPointerLeave={(e) => { if (sliding.active) onTouchEnd(e) }}
    >
      <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)`, position: 'relative' }}>
        {/* v1.2 方向轨迹光带 */}
        {lastDir && (
          <div
            className="pointer-events-none absolute inset-0 z-0"
            style={{
              background: lastDir === 'left' || lastDir === 'right'
                ? 'linear-gradient(90deg, transparent, rgba(251,191,36,0.12), transparent)'
                : 'linear-gradient(180deg, transparent, rgba(251,191,36,0.12), transparent)',
              animation: 'dirTrailFade 0.4s ease-out forwards',
            }}
          />
        )}
        {grid.flatMap((row, r) =>
          row.map((tile, c) => {
            const tier = tile ? levelToTier(Math.min(tile.level, 11)) : 0
            const isMoving = tile ? animTiles.has(tile.id) : false
            const isMatch3 = match3Lines.some(line => line.some(([lr, lc]) => lr === r && lc === c))
            return (
              <div
                key={`${r},${c}`}
                data-cell={`${r},${c}`}
                className={`relative flex aspect-square items-center justify-center rounded-xl text-2xl transition-all ${
                  tile ? TIER_CLASS[tier] : 'bg-white/[0.02] ring-1 ring-white/[0.04]'
                } ${isMoving ? 'tile-slide-in' : ''} ${isMatch3 ? 'match3-pulse' : ''}`}
                style={{
                  // 觉醒专属光晕
                  boxShadow: tile && tile.level > 11 ? '0 0 20px rgba(251,146,60,0.6), inset 0 0 12px rgba(251,146,60,0.2)' : undefined,
                }}
              >
                {tile ? (
                  <>
                    <span className={`drop-shadow ${tile.level > 11 ? 'animate-pulse' : ''}`} style={{ fontSize: tile.level > 11 ? '36px' : '32px' }}>
                      {getEmoji(tile)}
                    </span>
                    <span
                      className={`absolute bottom-1 right-1 rounded-full px-1.5 py-0.5 text-[9px] font-bold ${
                        tile.level > 11 ? 'bg-orange-500/80 text-white' : 'bg-black/50 text-white/70'
                      }`}
                    >
                      {tile.level <= 11 ? `Lv.${tile.level}` : getLevelLabel(tile.level).replace('醒·', '醒')}
                    </span>
                    {tile.level > 11 && (
                      <div className="pointer-events-none absolute inset-0 rounded-xl level-ray" style={{ background: 'radial-gradient(circle, rgba(251,191,36,0.6), transparent 60%)' }} />
                    )}
                    {isMatch3 && (
                      <div className="pointer-events-none absolute -top-1.5 -right-1.5 rounded-full bg-pink-500 px-1.5 text-[8px] font-bold text-white shadow-lg">
                        3连
                      </div>
                    )}
                  </>
                ) : null}
              </div>
            )
          }),
        )}
      </div>

      {/* 滑动提示 + v0.8 Dpad */}
      <div className="mt-2 flex items-center justify-center gap-2 text-[10px] text-white/30">
        <span>⇆</span>
        <span>滑动合并 · 方向键 / 触屏</span>
        <span className="ml-2 rounded-full bg-white/5 px-1.5 py-0.5 font-mono">C×{bestCombo}</span>
      </div>
      <div className="mt-2 flex items-center justify-center gap-3">
        <Dpad onSwipe={(d) => handleDirection(d, 0, 0)} hintDir={hintDir} />
        {/* v2.2 提示按钮 */}
        <button
          onClick={showHint}
          className="touch-target flex h-10 w-10 items-center justify-center rounded-xl bg-gold-500/15 text-xl ring-1 ring-gold-400/30 active:scale-90 transition-all hover:bg-gold-500/25"
          title="提示最佳方向"
        >
          💡
        </button>
      </div>
    </div>
  )
}

function eventScreenPos(
  pos: [number, number],
  container: HTMLElement | null,
): { x: number; y: number } {
  if (!container) return { x: window.innerWidth / 2, y: window.innerHeight / 2 }
  const r = container.getBoundingClientRect()
  const cellW = r.width / GRID_SIZE
  const cellH = (r.height - 32) / GRID_SIZE
  return {
    x: r.left + pos[1] * cellW + cellW / 2,
    y: r.top + pos[0] * cellH + cellH / 2,
  }
}
