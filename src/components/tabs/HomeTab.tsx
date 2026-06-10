/**
 * 主页 Tab（v0.3：季节buff + 主线任务条 + v0.4 签到/挑战/统计入口 + v0.6 周末双倍）
 */
import { Gashapon } from '@/components/gashapon/Gashapon'
import { MergeGrid } from '@/components/grid/MergeGrid'
import { AutoMergeButton } from '@/components/ui/AutoMergeButton'
import { WorldRing } from '@/components/ui/WorldRing'
import { CoinDisplay } from '@/components/ui/CoinDisplay'
import { useGameStore } from '@/store/gameStore'
import { useUiStore } from '@/store/uiStore'
import { ZONES, MAX_LEVEL, type ZoneId, ZONE_LIST } from '@/data/emoji-trees'
import { computeBuff, seasonEmoji, seasonLabel } from '@/lib/season'
import { hasCheckedInToday } from '@/lib/checkin'
import { isWeekendDouble } from '@/lib/weekend'

// v3.2 抽卡累计徽章阶梯
const PULL_MILESTONES = [
  { count: 10,  emoji: '🎯', label: '新手',    color: '#86efac' },
  { count: 50,  emoji: '🎲', label: '熟手',    color: '#67e8f9' },
  { count: 100, emoji: '🎰', label: '高手',    color: '#fbbf24' },
  { count: 500, emoji: '👑', label: '扭蛋王',  color: '#f472b6' },
]

export function HomeTab() {
  const coins = useGameStore(s => s.coins)
  const currentZone = useGameStore(s => s.currentZone)
  const dailyTasks = useGameStore(s => s.dailyTasks)
  const claimTask = useGameStore(s => s.claimTask)
  const totalPulls = useGameStore(s => s.totalPulls)
  const maxLevel = useGameStore(s => s.maxLevel)
  const zoneMax = useGameStore(s => s.zoneMax)
  const combo = useGameStore(s => s.combo)
  const collection = useGameStore(s => s.collection)
  const checkin = useGameStore(s => s.checkin)
  const challenges = useGameStore(s => s.challenges)

  const openZoneGallery = useUiStore(s => s.openZoneGallery)
  const openCheckin = useUiStore(s => s.openCheckin)
  const openStats = useUiStore(s => s.openStats)
  const setTab = useUiStore(s => s.setTab)

  const zone = ZONES[currentZone]
  const currentZoneCol = collection[currentZone] ?? []
  const clearedCount = Object.values(zoneMax).filter(v => v >= MAX_LEVEL).length
  const totalZones = Object.keys(zoneMax).length

  const buff = computeBuff(currentZone)
  const checkedToday = hasCheckedInToday(checkin)
  const challengesDone = challenges.filter((c: any) => c._claimed).length
  const weekend = isWeekendDouble()

  return (
    <div className="flex w-full flex-col items-center gap-3 px-3 py-2">
      {/* 货币 + 最高 + Combo + v0.4 入口 */}
      <div className="flex w-full max-w-[400px] items-center gap-1.5">
        <div className="glass flex flex-1 items-center gap-1.5 rounded-full px-2.5 py-1.5">
          <span className="text-base">🪙</span>
          <CoinDisplay value={coins} bumpKey={coins} className="text-sm" />
          <span className="text-[9px] text-white/30">扭蛋币</span>
        </div>
        <button
          onClick={openCheckin}
          className="glass relative flex items-center gap-1 rounded-full px-2 py-1.5 active:scale-95"
          style={{
            background: checkedToday ? 'rgba(34,197,94,0.2)' : 'rgba(251,191,36,0.15)',
          }}
        >
          <span className="text-sm">🎁</span>
          <span className="font-mono text-[10px] font-bold" style={{ color: checkedToday ? '#86efac' : '#fbbf24' }}>
            {checkin.streak}/7
          </span>
          {!checkedToday && (
            <span className="absolute -right-0.5 -top-0.5 h-1.5 w-1.5 animate-pulse rounded-full bg-red-500" />
          )}
        </button>
        <button
          onClick={openStats}
          className="glass flex items-center gap-1 rounded-full px-2 py-1.5 active:scale-95"
        >
          <span className="text-sm">📊</span>
        </button>
        <div className="glass flex items-center gap-1 rounded-full px-2 py-1.5">
          <span className="text-[9px] text-white/40">最高</span>
          <span className="font-mono text-[11px] font-bold text-ember-400">Lv.{maxLevel}</span>
        </div>
        {combo > 1 && (
          <div className="glass flex items-center gap-1 rounded-full px-2 py-1.5">
            <span className="text-[10px] text-gold-400">×{combo}</span>
          </div>
        )}
      </div>

      {/* v0.3 季节 buff 条（v1.2 拆 chip + 防 emoji 堆叠） */}
      <div
        className="flex w-full max-w-[400px] flex-wrap items-center gap-1.5 rounded-2xl px-2.5 py-1.5 text-[10px]"
        style={{
          background: 'linear-gradient(90deg, rgba(251,191,36,0.12), rgba(167,139,250,0.12))',
          border: '1px solid rgba(251,191,36,0.2)',
        }}
      >
        <span className="rounded-full bg-white/[0.06] px-1.5 py-0.5 text-[11px]">{seasonEmoji(buff.season)}</span>
        <span className="text-white/70">今日 <span className="text-gold-400 font-bold">{seasonLabel(buff.season)}季</span></span>
        <span className="rounded-full bg-emerald-500/15 px-1.5 py-0.5 text-emerald-300">
          🍀 {buff.luckyZoneName}
        </span>
        {weekend && (
          <span className="rounded-full bg-rose-500/20 px-1.5 py-0.5 text-rose-300 font-bold animate-pulse">
            🎉 周末双倍
          </span>
        )}
        {buff.multiplier > 1 ? (
          <span className="rounded-full bg-gold-500/30 px-1.5 py-0.5 font-mono font-bold text-gold-300">
            ×{buff.multiplier}
          </span>
        ) : (
          <span className="rounded-full bg-white/[0.04] px-1.5 py-0.5 text-white/40">5% 暴击</span>
        )}
      </div>

      {/* v3.2 创意：今日宜合 + 抽卡徽章进度 */}
      <DailyFortune totalPulls={totalPulls} currentZone={currentZone} />

      {/* 当前主题卡片 + 切换入口 */}
      <button
        onClick={openZoneGallery}
        className="touch-target flex w-full max-w-[400px] items-center gap-3 rounded-2xl p-3 text-left transition-all active:scale-[0.99]"
        style={{
          background: zone.bg,
          border: `1px solid ${zone.color}55`,
          boxShadow: `0 0 18px ${zone.glow}`,
        }}
      >
        <div
          className="flex h-12 w-12 items-center justify-center rounded-xl text-2xl"
          style={{ background: 'rgba(255,255,255,0.06)' }}
        >
          {zone.icon}
        </div>
        <div className="flex-1 leading-tight">
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-bold" style={{ color: zone.color }}>
              {zone.name}
            </span>
            <span className="text-[9px] text-white/40">· {zone.subtitle}</span>
          </div>
          <div className="mt-1 flex items-center gap-2 text-[10px] text-white/50">
            <span>已收集 {currentZoneCol.length}/{MAX_LEVEL}</span>
            <span className="text-white/20">·</span>
            <span>{clearedCount}/{totalZones} 通关</span>
          </div>
        </div>
        <div
          className="flex h-9 w-9 items-center justify-center rounded-full text-lg"
          style={{ background: 'rgba(255,255,255,0.05)' }}
        >
          🗺️
        </div>
      </button>

      {/* v1.1 主题推荐卡（卡关时显示） */}
      <ZoneSuggestion zoneMax={zoneMax} onPick={() => setTab('merge')} />

      {/* 扭蛋机 */}
      <Gashapon />

      {/* 网格 */}
      <MergeGrid />

      {/* v0.7 一键合并按钮 */}
      <AutoMergeButton />

      {/* v0.9 世界进度环 */}
      <WorldRing />

      {/* 7 日挑战 */}
      <Challenges challenges={challenges} />

      {/* 每日任务 */}
      <DailyTasks tasks={dailyTasks} onClaim={claimTask} />

      {/* 统计 */}
      <div className="w-full max-w-[400px] text-center text-[10px] text-white/25">
        累计扭蛋 {totalPulls} 次 · 最佳连击 {useGameStore.getState().bestCombo} · 挑战 {challengesDone}/{challenges.length}
      </div>
    </div>
  )
}

function Challenges({ challenges }: { challenges: any[] }) {
  return (
    <div className="w-full max-w-[400px] glass rounded-2xl p-3">
      <div className="mb-2 flex items-center justify-between text-xs">
        <span className="text-white/70">🎯 今日 7 日挑战</span>
        <span className="text-[10px] text-white/30">奖励丰厚</span>
      </div>
      <div className="flex flex-col gap-1.5">
        {challenges.map(c => {
          const progress = c._progress ?? 0
          const done = progress >= c.target
          const claimed = c._claimed
          return (
            <div key={c.id} className="flex items-center gap-2 text-xs">
              <div className="flex-1">
                <div className={done ? 'line-through text-white/40' : 'text-white/80'}>
                  {c.desc}
                </div>
                <div className="h-1 overflow-hidden rounded-full bg-white/5">
                  <div
                    className="h-full transition-all"
                    style={{
                      width: `${Math.min(100, (progress / c.target) * 100)}%`,
                      background: done
                        ? 'linear-gradient(90deg, #86efac, #a3e635)'
                        : 'linear-gradient(90deg, #fbbf24, #f97316)',
                    }}
                  />
                </div>
              </div>
              <div className="font-mono text-[10px] text-white/40">{progress}/{c.target}</div>
              {done && !claimed && (
                <span className="rounded-full bg-purple-500/30 px-2 py-0.5 text-[10px] font-bold text-purple-300">
                  +{c.reward.coins}🪙
                </span>
              )}
              {claimed && <span className="text-[10px] text-white/30">已领</span>}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function DailyTasks({ tasks, onClaim }: { tasks: any[]; onClaim: (id: string) => void }) {
  const completed = tasks.filter(t => t.completed).length
  return (
    <div className="w-full max-w-[400px] glass rounded-2xl p-3">
      <div className="mb-2 flex items-center justify-between text-xs">
        <span className="text-white/70">📜 今日任务</span>
        <span className="text-[10px] text-white/30">{completed}/{tasks.length} 已完成</span>
      </div>
      <div className="flex flex-col gap-1.5">
        {tasks.map(t => (
          <div key={t.id} className="flex items-center gap-2 text-xs">
            <div className="flex-1">
              <div className={t.completed ? 'line-through text-white/40' : 'text-white/80'}>
                {t.desc}
              </div>
              <div className="h-1 overflow-hidden rounded-full bg-white/5">
                <div
                  className="h-full transition-all"
                  style={{
                    width: `${Math.min(100, (t.progress / t.target) * 100)}%`,
                    background: t.completed ? 'linear-gradient(90deg, #86efac, #a3e635)' : 'rgba(255,255,255,0.2)',
                  }}
                />
              </div>
            </div>
            <div className="font-mono text-[10px] text-white/40">{t.progress}/{t.target}</div>
            {t.completed && !t.claimed && (
              <button
                onClick={() => onClaim(t.id)}
                className="touch-target rounded-full bg-gold-500 px-2 py-0.5 text-[10px] font-bold text-ink-900"
              >
                +{t.reward}🪙
              </button>
            )}
            {t.claimed && <span className="text-[10px] text-white/30">已领</span>}
          </div>
        ))}
      </div>
    </div>
  )
}

/**
 * v1.1 主题推荐：玩家卡关时（当前主题 Lv.≤3）推荐一个未探索 / 高潜力主题
 * - 规则 1：优先推荐"未探索"主题（max=0）
 * - 规则 2：其次推荐"未通关"主题（max<11）且与当前主题不同
 * - 规则 3：如果玩家已经通了一半以上主题，则不显示（避免打扰）
 */
function ZoneSuggestion({ zoneMax, onPick }: { zoneMax: Record<ZoneId, number>; onPick: () => void }) {
  const currentZone = useGameStore(s => s.currentZone)
  const setZone = useGameStore(s => s.setZone)
  const openZoneGallery = useUiStore(s => s.openZoneGallery)
  const setGuide = useUiStore(s => s.setGuide)
  const currentMax = zoneMax[currentZone] ?? 0

  if (currentMax > 3) return null

  const candidates = (Object.keys(ZONES) as ZoneId[]).map(zid => ({
    zid, z: ZONES[zid], max: zoneMax[zid] ?? 0,
  }))
  const cleared = candidates.filter(c => c.max >= MAX_LEVEL).length
  if (cleared >= 6) return null

  const unexplored = candidates.find(c => c.zid !== currentZone && c.max === 0)
  const exploring = candidates
    .filter(c => c.zid !== currentZone && c.max > 0 && c.max < MAX_LEVEL)
    .sort((a, b) => b.max - a.max)[0]
  const pick = unexplored ?? exploring
  if (!pick) return null

  const reason = unexplored ? '🌱 全新主题，从未探索' : `🧭 卡关？换个 ${pick.z.subtitle} 的视角再战`

  return (
    <div
      className="w-full max-w-[400px] rounded-2xl p-3 ring-1"
      style={{
        background: pick.z.bg,
        border: `1px solid ${pick.z.color}55`,
        boxShadow: `0 0 14px ${pick.z.glow}`,
      }}
    >
      <div className="mb-1.5 flex items-center justify-between">
        <span className="text-[10px] font-bold text-white/60">✨ 推荐主题</span>
        <button
          onClick={() => openZoneGallery()}
          className="text-[10px] text-white/40 underline-offset-2 hover:underline"
        >
          换一个
        </button>
      </div>
      <div className="flex items-center gap-2.5">
        <div
          className="flex h-10 w-10 items-center justify-center rounded-xl text-xl"
          style={{ background: 'rgba(255,255,255,0.06)' }}
        >
          {pick.z.icon}
        </div>
        <div className="flex-1 leading-tight">
          <div className="text-sm font-bold" style={{ color: pick.z.color }}>
            {pick.z.name}
          </div>
          <div className="text-[10px] text-white/60">{reason}</div>
          <div className="text-[9px] text-white/40 mt-0.5">{pick.z.flavor}</div>
        </div>
        <button
          onClick={() => {
            setZone(pick.zid)
            setGuide(`已切换到 ${pick.z.name}`)
            onPick()
          }}
          className="touch-target rounded-full bg-white/15 px-3 py-1 text-[11px] font-bold text-white active:scale-95"
          style={{ border: `1px solid ${pick.z.color}55` }}
        >
          去合成
        </button>
      </div>
    </div>
  )
}

/**
 * v3.2 创意：🔮 今日宜合 + 抽卡徽章阶梯
 * - 每日种子选主题卦象
 * - 抽卡累计 4 档徽章（10/50/100/500），每档解锁后灰显
 */
function DailyFortune({ totalPulls, currentZone }: { totalPulls: number; currentZone: ZoneId }) {
  const setZone = useGameStore(s => s.setZone)
  const setGuide = useUiStore(s => s.setGuide)

  // 每日种子：day-of-year % zone count
  const now = new Date()
  const dayOfYear = Math.floor((now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / 86400000)
  const fortuneIdx = dayOfYear % ZONE_LIST.length
  const fortuneZone = ZONE_LIST[fortuneIdx]
  const fortuneZ = fortuneZone ? ZONES[fortuneZone.id] : null
  if (!fortuneZ) return null
  const isCurrent = fortuneZone.id === currentZone
  const nextMilestone = PULL_MILESTONES.find(m => totalPulls < m.count)
  const nextIdx = PULL_MILESTONES.findIndex(m => totalPulls < m.count)
  const progressPct = nextMilestone
    ? Math.min(100, ((totalPulls - (PULL_MILESTONES[nextIdx - 1]?.count ?? 0)) / (nextMilestone.count - (PULL_MILESTONES[nextIdx - 1]?.count ?? 0))) * 100)
    : 100

  return (
    <div
      className="flex w-full max-w-[400px] flex-col gap-1.5 rounded-2xl px-2.5 py-2 text-[10px]"
      style={{
        background: 'linear-gradient(90deg, rgba(167,139,250,0.12), rgba(96,165,250,0.12))',
        border: '1px solid rgba(167,139,250,0.25)',
      }}
    >
      <div className="flex items-center gap-1.5">
        <span className="text-[11px]">🔮</span>
        <span className="text-white/60">今日宜合</span>
        <span
          className="rounded-full px-1.5 py-0.5 font-bold"
          style={{ background: `${fortuneZ.color}30`, color: fortuneZ.color }}
        >
          {fortuneZ.icon} {fortuneZ.name}
        </span>
        {isCurrent && (
          <span className="rounded-full bg-emerald-500/25 px-1.5 py-0.5 text-emerald-300">当前</span>
        )}
        {!isCurrent && (
          <button
            onClick={() => {
              setZone(fortuneZone.id)
              setGuide(`🔮 切换到 ${fortuneZ.name}，今日宜合`)
            }}
            className="rounded-full bg-white/10 px-2 py-0.5 text-[9px] text-white/70 active:scale-95"
          >
            切换
          </button>
        )}
      </div>
      {/* 抽卡徽章进度 */}
      <div className="flex items-center gap-1">
        {PULL_MILESTONES.map((m, i) => {
          const reached = totalPulls >= m.count
          return (
            <div key={m.count} className="flex items-center gap-0.5">
              <span
                className={`flex h-5 w-5 items-center justify-center rounded-full text-[11px] ring-1 ${reached ? '' : 'grayscale opacity-40'}`}
                style={{
                  background: reached ? `${m.color}33` : 'rgba(255,255,255,0.05)',
                  borderColor: reached ? m.color : 'rgba(255,255,255,0.1)',
                  boxShadow: reached ? `0 0 8px ${m.color}88` : 'none',
                }}
                title={`${m.label} · ${m.count} 抽`}
              >
                {m.emoji}
              </span>
              {i < PULL_MILESTONES.length - 1 && <span className="text-[8px] text-white/20">·</span>}
            </div>
          )
        })}
        {nextMilestone ? (
          <span className="ml-auto text-[9px] text-white/40">
            {totalPulls}/{nextMilestone.count} 抽 → {nextMilestone.emoji} {nextMilestone.label}
          </span>
        ) : (
          <span className="ml-auto text-[9px] text-pink-300 font-bold">👑 全部达成！</span>
        )}
      </div>
      {nextMilestone && (
        <div className="h-1 overflow-hidden rounded-full bg-white/5">
          <div
            className="h-full transition-all"
            style={{
              width: `${progressPct}%`,
              background: `linear-gradient(90deg, ${nextMilestone.color}, #fff)`,
            }}
          />
        </div>
      )}
    </div>
  )
}
