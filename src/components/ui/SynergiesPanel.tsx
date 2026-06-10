/**
 * v0.9 主题羁绊面板
 * - 6 对羁绊
 * - 每对显示状态：🔒 未激活 / ⚡ 激活中
 * - 激活后 buff 实时生效
 */
import { useGameStore } from '@/store/gameStore'
import { useUiStore } from '@/store/uiStore'
import { SYNERGIES, isSynergyActive, type Synergy } from '@/lib/synergies'
import { ZONES } from '@/data/emoji-trees'

const BUFF_LABEL: Record<string, string> = {
  coin_mult: '🪙 +%s 收益',
  crit_rate: '💥 +%s% 暴击',
  luck: '🍀 +%s% 幸运',
}

const formatBuff = (s: Synergy) => {
  const v = s.buffValue * (s.buff === 'crit_rate' || s.buff === 'luck' ? 100 : 100)
  return BUFF_LABEL[s.buff]?.replace('%s', String(v))
}

export function SynergiesPanel() {
  const zoneMax = useGameStore(s => s.zoneMax)
  const show = useUiStore(s => s.showSynergies)
  const close = useUiStore(s => s.closeSynergies)

  if (!show) return null

  return (
    <div
      className="pointer-events-auto fixed inset-0 z-40 flex items-end justify-center bg-black/60 backdrop-blur-sm sm:items-center"
      onClick={close}
    >
      <div
        onClick={e => e.stopPropagation()}
        className="relative w-full max-w-md max-h-[85vh] overflow-y-auto rounded-t-3xl bg-gradient-to-b from-slate-900 to-slate-950 p-5 shadow-2xl sm:rounded-3xl"
      >
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">🔗 主题羁绊</h2>
          <button onClick={close} className="text-white/50 hover:text-white text-xl">×</button>
        </div>
        <div className="text-[11px] text-white/50 mb-3">
          凑齐 <span className="text-pink-300">2 个区域都达到 Lv.10+</span> 解锁被动加成
        </div>
        <div className="space-y-2">
          {SYNERGIES.map(syn => {
            const aZone = ZONES[syn.pair[0]]
            const bZone = ZONES[syn.pair[1]]
            const aLv = zoneMax[syn.pair[0]] ?? 0
            const bLv = zoneMax[syn.pair[1]] ?? 0
            const active = isSynergyActive(syn, zoneMax)
            return (
              <div
                key={syn.id}
                className={`rounded-2xl p-3 ring-1 ${
                  active
                    ? 'bg-gradient-to-r from-pink-500/20 to-purple-500/20 ring-pink-400/40'
                    : 'bg-white/[0.03] ring-white/5'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{syn.emoji}</span>
                  <div className="flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className={`text-sm font-bold ${active ? 'text-pink-300' : 'text-white/80'}`}>{syn.title}</span>
                      {active && <span className="rounded-full bg-pink-500/30 px-1.5 py-0.5 text-[8px] font-bold text-pink-200">⚡激活</span>}
                    </div>
                    <div className="text-[10px] text-white/50">{syn.desc}</div>
                  </div>
                </div>
                <div className="mt-2 flex items-center justify-between gap-2">
                  <div className="flex flex-1 items-center gap-1.5 text-[10px]">
                    <span>{aZone.icon}</span>
                    <span className="text-white/70">{aZone.name}</span>
                    <div className="flex-1 h-1 overflow-hidden rounded-full bg-white/5">
                      <div className="h-full" style={{ width: `${Math.min(100, (aLv / 10) * 100)}%`, background: aLv >= 10 ? '#f472b6' : aZone.glow }} />
                    </div>
                    <span className={`font-mono ${aLv >= 10 ? 'text-pink-300' : 'text-white/40'}`}>Lv.{aLv}</span>
                  </div>
                  <span className="text-white/30">+</span>
                  <div className="flex flex-1 items-center gap-1.5 text-[10px]">
                    <span>{bZone.icon}</span>
                    <span className="text-white/70">{bZone.name}</span>
                    <div className="flex-1 h-1 overflow-hidden rounded-full bg-white/5">
                      <div className="h-full" style={{ width: `${Math.min(100, (bLv / 10) * 100)}%`, background: bLv >= 10 ? '#f472b6' : bZone.glow }} />
                    </div>
                    <span className={`font-mono ${bLv >= 10 ? 'text-pink-300' : 'text-white/40'}`}>Lv.{bLv}</span>
                  </div>
                </div>
                <div className={`mt-1.5 text-[10px] ${active ? 'text-pink-300 font-bold' : 'text-white/40'}`}>
                  {active ? `✅ ${formatBuff(syn)}` : `🔒 解锁后获得：${formatBuff(syn)}`}
                </div>
              </div>
            )
          })}
        </div>
        <div className="mt-4 text-center text-[10px] text-white/30">点击任意处关闭</div>
      </div>
    </div>
  )
}
