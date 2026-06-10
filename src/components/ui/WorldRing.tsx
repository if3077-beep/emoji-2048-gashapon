/**
 * v0.9 世界进度环
 * - 12 主题（每个 segment 30°）
 * - 进度 = sum(maxLevel) / (12 * 11)
 * - 凑齐整圈 → 解锁"传说蛋"
 */
import { useGameStore } from '@/store/gameStore'
import { ZONES } from '@/data/emoji-trees'
import { computeWorldProgress } from '@/lib/synergies'

export function WorldRing() {
  const zoneMax = useGameStore(s => s.zoneMax)
  const progress = computeWorldProgress(zoneMax)
  const pct = Math.round(progress * 100)

  // 12 段弧（每段 30°）
  const segments = Object.values(ZONES).slice(0, 12)
  const r = 50
  const cx = 60
  const cy = 60
  const circ = 2 * Math.PI * r

  return (
    <div className="flex w-full max-w-[360px] items-center gap-3 rounded-2xl bg-white/[0.03] px-3 py-2 ring-1 ring-white/5">
      {/* SVG ring */}
      <div className="relative">
        <svg width="60" height="60" viewBox="0 0 120 120">
          {segments.map((zone, i) => {
            const lv = Math.min(11, zoneMax[zone.id] ?? 0)
            const segPct = lv / 11
            const offset = circ * (1 - segPct) * (i / 12 + (1 / 12))
            return (
              <circle
                key={zone.id}
                cx={cx}
                cy={cy}
                r={r}
                fill="none"
                stroke="rgba(255,255,255,0.06)"
                strokeWidth="6"
                strokeDasharray={`${(circ / 12) * 0.85} ${circ}`}
                strokeDashoffset={-circ * (i / 12)}
                transform={`rotate(-90 ${cx} ${cy})`}
              />
            )
          })}
          {segments.map((zone, i) => {
            const lv = Math.min(11, zoneMax[zone.id] ?? 0)
            const segPct = lv / 11
            const color = zone.glow
            return (
              <circle
                key={zone.id + '-fg'}
                cx={cx}
                cy={cy}
                r={r}
                fill="none"
                stroke={color}
                strokeWidth="6"
                strokeDasharray={`${(circ / 12) * 0.85 * segPct} ${circ}`}
                strokeDashoffset={-circ * (i / 12)}
                transform={`rotate(-90 ${cx} ${cy})`}
                style={{ transition: 'all 0.5s ease' }}
              />
            )
          })}
        </svg>
        <div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-white/70">
          {pct}%
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-0.5">
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-white/50">🌍 世界进度</span>
          <span className="text-[10px] text-white/30 font-mono">
            {Object.values(zoneMax).filter(lv => (lv ?? 0) >= 11).length} / 12
          </span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-white/5">
          <div
            className="h-full transition-all"
            style={{
              width: `${pct}%`,
              background: 'linear-gradient(90deg, #fde68a, #f9a8d4, #a78bfa)',
            }}
          />
        </div>
        <div className="text-[9px] text-white/30">
          {pct >= 100 ? '✨ 凑齐整圈！传说蛋待领取' : `凑齐整圈解锁「传说蛋」`}
        </div>
      </div>
    </div>
  )
}
