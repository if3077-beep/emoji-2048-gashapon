/**
 * 本地排行榜 v0.6
 * - 3 个榜单：最高连击 / 最高等级 / 通关主题数
 * - localStorage 存多玩家
 */
import { useEffect, useState } from 'react'
import { useGameStore } from '@/store/gameStore'
import { useUiStore } from '@/store/uiStore'
import { getTopEntries, submitEntry, computeMyEntry, defaultName, type LeaderboardEntry } from '@/lib/leaderboard'

type BoardKey = 'bestCombo' | 'maxLevel' | 'clearedZones'

const BOARDS: Array<{ key: BoardKey; label: string; icon: string; color: string }> = [
  { key: 'bestCombo',    label: '最高连击', icon: '🔥', color: '#fb923c' },
  { key: 'maxLevel',     label: '最高等级', icon: '⭐', color: '#a78bfa' },
  { key: 'clearedZones', label: '通关主题', icon: '🏆', color: '#fbbf24' },
]

export function LeaderboardPanel() {
  const show = useUiStore(s => s.showLeaderboard)
  const close = useUiStore(s => s.closeLeaderboard)
  const bestCombo = useGameStore(s => s.bestCombo)
  const maxLevel = useGameStore(s => s.maxLevel)
  const totalPulls = useGameStore(s => s.totalPulls)
  const zoneMax = useGameStore(s => s.zoneMax)
  const pushToast = useUiStore(s => s.pushToast)
  const [tab, setTab] = useState<BoardKey>('bestCombo')
  const [entries, setEntries] = useState<LeaderboardEntry[]>([])
  const [playerName, setPlayerName] = useState('')

  useEffect(() => {
    setEntries(getTopEntries(tab))
  }, [tab, show])

  const onJoin = () => {
    const name = playerName.trim() || defaultName()
    const entry = computeMyEntry(name, { bestCombo, maxLevel, zoneMax, totalPulls })
    submitEntry(entry)
    setEntries(getTopEntries(tab))
    setPlayerName('')
    pushToast(`🏅 已加入排行榜！`, '🏆', 2)
  }

  if (!show) return null

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/60 backdrop-blur-sm sm:items-center" onClick={close}>
      <div
        className="relative flex w-full max-w-[400px] flex-col glass-strong rounded-t-3xl p-5 sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between">
          <div>
            <div className="text-base font-bold text-white/90">🏅 排行榜</div>
            <div className="mt-0.5 text-[10px] text-white/40">本地存储 · 多玩家并存</div>
          </div>
          <button onClick={close} className="flex h-9 w-9 items-center justify-center rounded-full bg-white/5 text-white/60 active:scale-95" aria-label="关闭">✕</button>
        </div>

        {/* Tabs */}
        <div className="mb-3 flex gap-1.5">
          {BOARDS.map(b => (
            <button
              key={b.key}
              onClick={() => setTab(b.key)}
              className="flex-1 rounded-full py-1.5 text-xs font-bold transition-all active:scale-95"
              style={{
                background: tab === b.key ? `${b.color}25` : 'rgba(255,255,255,0.04)',
                color: tab === b.key ? b.color : 'rgba(255,255,255,0.5)',
                border: tab === b.key ? `1px solid ${b.color}55` : '1px solid rgba(255,255,255,0.05)',
              }}
            >
              {b.icon} {b.label}
            </button>
          ))}
        </div>

        {/* 列表 */}
        <div className="mb-3 max-h-[40vh] overflow-y-auto scrollbar-hidden">
          {entries.length === 0 ? (
            <div className="py-6 text-center text-xs text-white/30">还没有玩家上榜</div>
          ) : (
            <div className="flex flex-col gap-1">
              {entries.map((e, i) => (
                <div
                  key={e.id}
                  className="flex items-center gap-2 rounded-xl px-2.5 py-1.5"
                  style={{
                    background: i === 0 ? 'linear-gradient(90deg, rgba(251,191,36,0.2), transparent)' : 'rgba(255,255,255,0.02)',
                  }}
                >
                  <div className="w-6 text-center font-mono text-sm font-bold" style={{ color: i === 0 ? '#fbbf24' : i === 1 ? '#c0c0c0' : i === 2 ? '#cd7f32' : 'rgba(255,255,255,0.3)' }}>
                    {i + 1}
                  </div>
                  <div className="flex-1 text-sm text-white/80">{e.name}</div>
                  <div className="font-mono text-sm font-bold text-white/90">
                    {tab === 'bestCombo' ? `×${e.bestCombo}` : tab === 'maxLevel' ? `Lv.${e.maxLevel}` : `${e.clearedZones}/12`}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 加入 */}
        <div className="flex gap-1.5">
          <input
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            placeholder="你的名字（留空随机）"
            className="flex-1 rounded-full bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/30"
          />
          <button
            onClick={onJoin}
            className="touch-target rounded-full bg-gradient-to-r from-gold-500 to-ember-500 px-4 text-sm font-bold text-ink-900 active:scale-95"
          >
            上榜
          </button>
        </div>
      </div>
    </div>
  )
}
