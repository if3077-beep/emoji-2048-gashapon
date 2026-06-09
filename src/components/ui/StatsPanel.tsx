/**
 * 数据面板 v0.4
 * - 累计扭蛋 / 累计合成 / 最高连击 / 历史最高 / 收藏率
 * - 7 日等级曲线（迷你 sparkline）
 * - 首次游戏时间 / 累计游戏天数
 */
import { useGameStore } from '@/store/gameStore'
import { useUiStore } from '@/store/uiStore'
import { ZONE_LIST, MAX_LEVEL } from '@/data/emoji-trees'

export function StatsPanel() {
  const show = useUiStore(s => s.showStats)
  const close = useUiStore(s => s.closeStats)
  const totalPulls = useGameStore(s => s.totalPulls)
  const mergeCount = useGameStore(s => s.mergeCount)
  const bestCombo = useGameStore(s => s.bestCombo)
  const maxLevel = useGameStore(s => s.maxLevel)
  const collection = useGameStore(s => s.collection)
  const zoneMax = useGameStore(s => s.zoneMax)
  const history = useGameStore(s => s.history)
  const pet = useGameStore(s => s.pet)

  if (!show) return null

  const totalCollected = Object.values(collection).reduce((s, arr) => s + arr.length, 0)
  const maxPossible = ZONE_LIST.length * MAX_LEVEL
  const collectedPct = Math.round((totalCollected / maxPossible) * 100)
  const clearedZones = Object.values(zoneMax).filter(v => v >= MAX_LEVEL).length
  const days = Math.max(1, Math.floor((Date.now() - history.firstPlayedAt) / 86_400_000))
  const firstDate = new Date(history.firstPlayedAt).toLocaleDateString('zh-CN')

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/60 backdrop-blur-sm sm:items-center" onClick={close}>
      <div
        className="relative flex h-[85vh] w-full max-w-[440px] flex-col glass-strong rounded-t-3xl p-5 sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between">
          <div>
            <div className="text-base font-bold text-white/90">📊 数据面板</div>
            <div className="mt-0.5 text-[10px] text-white/40">你的所有战绩</div>
          </div>
          <button onClick={close} className="flex h-9 w-9 items-center justify-center rounded-full bg-white/5 text-white/60 active:scale-95" aria-label="关闭">✕</button>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-hidden">
          {/* 主数据卡片 */}
          <div className="mb-3 grid grid-cols-2 gap-2">
            <Stat icon="🎰" label="累计扭蛋" value={totalPulls.toLocaleString()} color="#fbbf24" />
            <Stat icon="🧬" label="累计合成" value={mergeCount.toLocaleString()} color="#86efac" />
            <Stat icon="🔥" label="最佳连击" value={`×${history.longestCombo || bestCombo}`} color="#fb923c" />
            <Stat icon="⭐" label="最高等级" value={`Lv.${maxLevel}`} color="#a78bfa" />
            <Stat icon="📖" label="图鉴" value={`${totalCollected}/${maxPossible} (${collectedPct}%)`} color="#60a5fa" />
            <Stat icon="🏆" label="通关主题" value={`${clearedZones}/${ZONE_LIST.length}`} color="#f0abfc" />
          </div>

          {/* 7 日曲线 */}
          <div className="mb-3 rounded-2xl bg-white/[0.03] p-3">
            <div className="mb-1.5 text-[10px] text-white/60">📈 7 日等级曲线</div>
            <Sparkline data={history.levelByDay.length === 7 ? history.levelByDay : [...Array(7)].map((_, i) => 0)} max={Math.max(11, maxLevel)} />
            <div className="mt-1 text-[9px] text-white/30">数据按天统计，达到过的最高等级</div>
          </div>

          {/* 详情 */}
          <div className="rounded-2xl bg-white/[0.03] p-3 text-xs text-white/70">
            <Row label="首次游戏" value={firstDate} />
            <Row label="累计游戏天数" value={`${days} 天`} />
            <Row label="累计收入" value={`${history.totalEarned} 🪙`} />
            <Row label="累计支出" value={`${history.totalSpent} 🪙`} />
            {pet && (
              <>
                <Row label="宠物" value={`${pet.name} ${pet.speciesEmoji}`} />
                <Row label="宠物好感" value={`${pet.affection}/100`} />
                <Row label="宠物形态" value={pet.form === 'egg' ? '蛋' : pet.form === 'baby' ? '幼崽' : pet.form === 'adult' ? '成体' : '觉醒'} />
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function Stat({ icon, label, value, color }: { icon: string; label: string; value: string; color: string }) {
  return (
    <div className="flex items-center gap-2 rounded-2xl bg-white/[0.04] p-2.5">
      <div className="flex h-9 w-9 items-center justify-center rounded-xl text-lg" style={{ background: `${color}22`, color }}>{icon}</div>
      <div className="flex-1 leading-tight">
        <div className="text-[9px] text-white/40">{label}</div>
        <div className="text-sm font-bold" style={{ color }}>{value}</div>
      </div>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-white/5 py-1.5 last:border-0">
      <span className="text-white/50">{label}</span>
      <span className="font-mono text-white/80">{value}</span>
    </div>
  )
}

/** 简易 sparkline（纯 SVG，无依赖） */
function Sparkline({ data, max }: { data: number[]; max: number }) {
  const w = 360
  const h = 60
  const step = w / Math.max(1, data.length - 1)
  const points = data.map((v, i) => `${i * step},${h - (v / max) * h}`).join(' ')
  const last = data.length - 1
  const lastX = last * step
  const lastY = h - (data[last]! / max) * h
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full" preserveAspectRatio="none" style={{ height: 60 }}>
      <defs>
        <linearGradient id="spark-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fbbf24" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#fbbf24" stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={`0,${h} ${points} ${w},${h}`} fill="url(#spark-fill)" />
      <polyline points={points} fill="none" stroke="#fbbf24" strokeWidth="2" strokeLinejoin="round" />
      <circle cx={lastX} cy={lastY} r="3" fill="#fbbf24" />
    </svg>
  )
}
