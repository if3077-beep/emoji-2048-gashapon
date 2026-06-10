/**
 * 4×4 滑动合并网格（v0.2：方向滑动 + 滑入动效 + 觉醒支持）
 * - 上/下/左/右滑动 → 整行/列推动 → 自动合并
 * - 支持触屏和键盘方向键
 * - 滑动后给 merge-engine 跑一遍事件流
 */
import { useGameStore } from '@/store/gameStore'
import { useUiStore } from '@/store/uiStore'
import { ZONES, GRID_SIZE, getLevelLabel, getEmoji, getName } from '@/data/emoji-trees'
import { sfx, resumeAudio } from '@/lib/audio'
import { levelToTier, type Grid, type Tile, findZoneMax, findBestHint } from '@/lib/merge-engine'
import { calcReward, getReward, type EventKind } from '@/lib/event-rewards'
import { useRef, useState, useCallback, useEffect } from 'react'
import gsap from 'gsap'
import { Dpad } from './Dpad'
import { detectMatch3, findLongestMatch } from '@/lib/auto-merge'
import {
  AURORA, TRAIL_GRADIENT, BEAM_HStyle, BEAM_VStyle, zoneColor, zoneGlow,
  startBallInner, startBallShadow, endBurstInner, endBurstShadow,
  cellFlash, mergeFloatShadow, flyTextColor, dropShadow,
} from '@/lib/effects'

const TIER_CLASS = ['tier-common', 'tier-rare', 'tier-epic', 'tier-legend']

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
  const mergeCount = useGameStore(s => s.mergeCount)  // v6.4 新手引导用

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
    // v4.0 重做轨迹动画：起点光球 + 流光带扫过 + 粒子尾迹
    setTimeout(() => {
      if (!containerRef.current) return
      const grid = containerRef.current
      const rect = grid.getBoundingClientRect()
      const cellW = (rect.width - 24) / GRID_SIZE
      const cellH = (rect.height - 24 - 50) / GRID_SIZE

      // 1) 起点（result.moves 第一格的 from）和终点（最后 to）
      const start = result.moves[0]?.from
      const end = result.moves[result.moves.length - 1]?.to
      const isHorizontal = dir === 'left' || dir === 'right'

      // 2) 起点光球：紫青双层（v6.0 替换黄色）
      if (start) {
        const startX = (start[1] + 0.5) * cellW + 12
        const startY = (start[0] + 0.5) * cellH + 12
        const ball = document.createElement('div')
        ball.className = 'pointer-events-none absolute z-30'
        ball.style.cssText = `left:0;top:0;width:${cellW}px;height:${cellH}px;transform:translate(${startX - cellW / 2}px,${startY - cellH / 2}px);`
        const inner = document.createElement('div')
        inner.style.cssText = `width:100%;height:100%;border-radius:50%;background:${startBallInner};box-shadow:${startBallShadow};`
        ball.appendChild(inner)
        grid.appendChild(ball)
        gsap.fromTo(ball, { scale: 0, opacity: 0 }, { scale: 1.4, opacity: 1, duration: 0.15, ease: 'power2.out' })
        gsap.to(ball, { scale: 0.3, opacity: 0, duration: 0.5, delay: 0.2, ease: 'power2.in', onComplete: () => ball.remove() })
      }

      // 3) 流光带（紫青渐变 6px 宽/高带，0.4s GSAP 沿方向滑过整个 grid）
      if (end) {
        const endX = (end[1] + 0.5) * cellW + 12
        const endY = (end[0] + 0.5) * cellH + 12
        const beam = document.createElement('div')
        beam.className = 'pointer-events-none absolute z-20'
        if (isHorizontal) {
          // 横向：竖条 width 6px 滑过
          const isRight = dir === 'right'
          const beamStyle = BEAM_HStyle(rect.height - 74)
          beam.style.cssText = `left:0;top:0;width:6px;height:${rect.height - 74}px;transform:translate(${isRight ? 0 : rect.width - 6}px,12px);background:${beamStyle.background};box-shadow:${beamStyle.boxShadow};`
          grid.appendChild(beam)
          gsap.fromTo(beam, { x: 0 }, { x: isRight ? rect.width - 6 : -(rect.width - 6), duration: 0.4, ease: 'power2.out' })
          gsap.to(beam, { opacity: 0, duration: 0.2, delay: 0.35, onComplete: () => beam.remove() })
        } else {
          // 纵向：横条 height 6px 滑过
          const isDown = dir === 'down'
          const beamStyle = BEAM_VStyle(rect.width - 24)
          beam.style.cssText = `left:0;top:0;width:${rect.width - 24}px;height:6px;transform:translate(12px,${isDown ? 0 : rect.height - 80}px);background:${beamStyle.background};box-shadow:${beamStyle.boxShadow};`
          grid.appendChild(beam)
          gsap.fromTo(beam, { y: 0 }, { y: isDown ? rect.height - 86 : -(rect.height - 86), duration: 0.4, ease: 'power2.out' })
          gsap.to(beam, { opacity: 0, duration: 0.2, delay: 0.35, onComplete: () => beam.remove() })
        }
        // 终点爆裂：紫青径向 burst
        const burst = document.createElement('div')
        burst.className = 'pointer-events-none absolute z-30'
        burst.style.cssText = `left:0;top:0;width:60px;height:60px;transform:translate(${endX - 30}px,${endY - 30}px);background:${endBurstInner};box-shadow:${endBurstShadow};`
        grid.appendChild(burst)
        gsap.fromTo(burst, { scale: 0, opacity: 0 }, { scale: 1.6, opacity: 1, duration: 0.18, ease: 'power2.out' })
        gsap.to(burst, { scale: 2.4, opacity: 0, duration: 0.42, delay: 0.12, ease: 'power2.in', onComplete: () => burst.remove() })
      }

      // 4) 移动过的 cell 依次闪光（紫青白光）
      const movedList = result.moves.map(m => m.to)
      movedList.forEach((pos, i) => {
        const cell = grid.querySelector(`[data-cell="${pos[0]},${pos[1]}"]`) as HTMLElement | null
        if (!cell) return
        gsap.fromTo(
          cell,
          { boxShadow: cellFlash(currentZone) },
          { boxShadow: 'inset 0 0 0 0 rgba(255,255,255,0), 0 0 0 rgba(255,255,255,0)', duration: 0.4, delay: i * 0.04, ease: 'power2.out' },
        )
      })

      // 4b) v6.0 合并位置 tile 浮起（紫青色阴影）
      const mergeSet = new Set(result.events.map(e => e.pos.join(',')))
      Array.from(mergeSet).forEach((posKey, i) => {
        const cell = grid.querySelector(`[data-cell="${posKey}"]`) as HTMLElement | null
        if (!cell) return
        gsap.fromTo(
          cell,
          { y: 0, scale: 1, boxShadow: mergeFloatShadow(currentZone) },
          {
            y: -10,
            scale: 1.12,
            duration: 0.18,
            delay: i * 0.04,
            ease: 'power2.out',
            onComplete: () => {
              gsap.to(cell, { y: 0, scale: 1, duration: 0.32, ease: 'bounce.out' })
              gsap.to(cell, { clearProps: 'boxShadow', duration: 0.4, delay: 0.05 })
            },
          },
        )
      })

      // 4c) v6.0 4+ 连锁 → grid 整体震动 + 5+ 连锁 → 紫青粒子向上汇聚
      const matched = findLongestMatch(result.grid).longest
      if (matched >= 4) {
        gsap.fromTo(
          grid,
          { x: -3, y: 2 },
          { x: 0, y: 0, duration: 0.4, ease: 'elastic.out(1, 0.3)' },
        )
        if (matched >= 5) {
          // 撒 12 个紫青粒子向上汇聚
          const particleCount = 12
          for (let p = 0; p < particleCount; p++) {
            const ev = result.events[p % Math.max(1, result.events.length)]
            if (!ev) continue
            const px = (ev.pos[1] + 0.5) * cellW + 12
            const py = (ev.pos[0] + 0.5) * cellH + 12
            const particle = document.createElement('div')
            particle.textContent = ['⭐', '✨', '💫', '🌟', '💜'][p % 5]
            particle.className = 'pointer-events-none absolute z-30'
            particle.style.cssText = `left:${px - 8}px;top:${py - 8}px;font-size:16px;filter:drop-shadow(0 0 6px ${AURORA.cyan});`
            grid.appendChild(particle)
            const targetX = px + (Math.random() - 0.5) * 80
            const targetY = -30
            gsap.fromTo(
              particle,
              { x: 0, y: 0, scale: 0.3, opacity: 0, rotation: 0 },
              {
                x: targetX - px,
                y: targetY - py,
                scale: 1.4,
                opacity: 1,
                rotation: 720,
                duration: 0.8,
                ease: 'power2.out',
                onComplete: () => {
                  gsap.to(particle, { y: '-=40', opacity: 0, scale: 0.3, duration: 0.3, onComplete: () => particle.remove() })
                },
              },
            )
          }
        }
      }

      // 5) 粒子尾迹：在起点向终点方向撒 6-8 个 ⭐ 颗粒（沿反方向飞）
      if (start && end) {
        const sx = (start[1] + 0.5) * cellW + 12
        const sy = (start[0] + 0.5) * cellH + 12
        const dirX = isHorizontal ? (dir === 'right' ? 1 : -1) : 0
        const dirY = isHorizontal ? 0 : (dir === 'down' ? 1 : -1)
        const particleCount = Math.min(8, 4 + movedList.length)
        for (let i = 0; i < particleCount; i++) {
          const p = document.createElement('div')
          p.textContent = ['⭐', '✨', '💫', '🌟'][i % 4]
          p.className = 'pointer-events-none absolute z-30'
          p.style.cssText = `left:${sx - 6}px;top:${sy - 6}px;font-size:14px;`
          grid.appendChild(p)
          // 沿反方向 + 随机垂直分量飘 0.5s
          const offsetX = -dirX * (30 + Math.random() * 60) + (isHorizontal ? 0 : (Math.random() - 0.5) * 30)
          const offsetY = -dirY * (30 + Math.random() * 60) + (isHorizontal ? (Math.random() - 0.5) * 30 : 0)
          gsap.fromTo(
            p,
            { x: 0, y: 0, scale: 0, opacity: 0, rotation: 0 },
            { x: offsetX, y: offsetY, scale: 1.4, opacity: 1, rotation: 360, duration: 0.15, ease: 'power2.out' },
          )
          gsap.to(p, { x: offsetX * 1.6, y: offsetY * 1.6, scale: 0, opacity: 0, duration: 0.4, delay: 0.12, ease: 'power2.in', onComplete: () => p.remove() })
        }
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
            fly.style.color = flyTextColor(isCrit, isLucky)
            fly.style.textShadow = '0 0 6px rgba(0,0,0,0.6), 0 0 12px currentColor'
            cell.appendChild(fly)
            gsap.fromTo(
              fly,
              { y: 0, scale: 0.6, opacity: 0 },
              { y: -34, scale: 1.3, opacity: 1, duration: 0.25, ease: 'back.out(1.7)' },
            )
            gsap.to(fly, { y: -56, opacity: 0, duration: 0.55, delay: 0.3, ease: 'power1.in', onComplete: () => fly.remove() })
            // v4.2 合成后的 emoji 粒子飞起（核心 emoji + 主题色）
            const tile = grid[evt.pos[0]]?.[evt.pos[1]]
            if (tile) {
              const newEmoji = getEmoji(tile)
              const newLevel = tile.level
              // v6.5 合并 emoji 粒子动效增强：5 颗、距离更远、旋转更狂、弹性曲线
              const particleCount = newLevel > 11 ? 7 : 5
              for (let p = 0; p < particleCount; p++) {
                const ep = document.createElement('div')
                ep.textContent = newEmoji
                ep.className = 'pointer-events-none absolute left-1/2 top-1/2 z-30 -translate-x-1/2 -translate-y-1/2'
                ep.style.fontSize = newLevel >= 10 ? '26px' : '22px'
                ep.style.filter = `drop-shadow(0 0 8px ${dropShadow(isCrit, isLucky)})`
                cell.appendChild(ep)
                // 360° 均匀分布 + 一点随机
                const baseAngle = (p / particleCount) * Math.PI * 2
                const angle = baseAngle + (Math.random() - 0.5) * 0.5
                const dist = 48 + Math.random() * 36
                gsap.fromTo(
                  ep,
                  { x: 0, y: 0, scale: 0.2, opacity: 0, rotation: 0 },
                  {
                    x: Math.sin(angle) * dist,
                    y: -Math.cos(angle) * dist - 24,
                    scale: newLevel > 11 ? 1.6 : newLevel >= 10 ? 1.3 : 1,
                    opacity: 1,
                    rotation: angle * 220,
                    duration: 0.5,
                    ease: 'back.out(1.6)',
                  },
                )
                gsap.to(ep, { y: `+=${60}`, opacity: 0, scale: 0.2, duration: 0.6, delay: 0.4, ease: 'power2.in', onComplete: () => ep.remove() })
              }
            }
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

  // v6.4 新手引导：前 3 次合并前显示"← → ↑ ↓ 滑动"提示
  const showSwipeHint = mergeCount < 3 && grid.some(row => row.some(t => t))

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
      {/* v6.4 新手引导：滑动 4 方向箭头 + 提示文字 */}
      {showSwipeHint && (
        <div
          className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center"
          style={{
            background: 'radial-gradient(circle, rgba(167,139,250,0.18) 0%, transparent 70%)',
            animation: 'swipeHintPulse 1.6s ease-in-out infinite',
          }}
        >
          <div className="text-center">
            <div className="text-3xl" style={{ animation: 'swipeArrows 1.6s ease-in-out infinite' }}>
              👆👇👈👉
            </div>
            <div className="mt-1 rounded-full bg-violet-500/30 px-2 py-0.5 text-[10px] font-bold text-white backdrop-blur-sm">
              滑动方向合成
            </div>
          </div>
          <style>{`
            @keyframes swipeHintPulse {
              0%, 100% { opacity: 0.85; }
              50% { opacity: 1; }
            }
            @keyframes swipeArrows {
              0%   { letter-spacing: 0.1em; transform: scale(1); }
              50%  { letter-spacing: 0.5em; transform: scale(1.1); }
              100% { letter-spacing: 0.1em; transform: scale(1); }
            }
          `}</style>
        </div>
      )}
      <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)`, position: 'relative' }}>
        {/* v1.2 方向轨迹光带（v6.3 紫青替代金色） */}
        {lastDir && (
          <div
            className="pointer-events-none absolute inset-0 z-0"
            style={{
              background: lastDir === 'left' || lastDir === 'right'
                ? 'linear-gradient(90deg, transparent, rgba(167,139,250,0.18), transparent)'
                : 'linear-gradient(180deg, transparent, rgba(103,232,249,0.18), transparent)',
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
