/**
 * v12.1 设置抽屉：右侧滑入，集中收纳次要入口
 * - 触发：[⚙️] 按钮 / ESC / 点击遮罩 / 屏幕右滑 24px 边缘手势
 * - 锁 body scroll
 * - 紫青渐变背景 + 0.4s 滑入动画
 */
import { useEffect } from 'react'
import { useGameStore } from '@/store/gameStore'
import { useUiStore } from '@/store/uiStore'
import { hasCheckedInToday } from '@/lib/checkin'
import { isWeekendDouble } from '@/lib/weekend'
import { getSeason, seasonEmoji, seasonLabel } from '@/lib/season'
import { computeBuff } from '@/lib/season'
import { useState as useReactState } from 'react'
import { ResetConfirmModal } from './ResetConfirmModal'

export function SettingsDrawer() {
  const open = useUiStore(s => s.settingsOpen)
  const setOpen = useUiStore(s => s.setSettingsOpen)
  const setConfirmResetOpen = useUiStore(s => s.setConfirmResetOpen)
  const muted = useUiStore(s => s.muted)
  const setMuted = useUiStore(s => s.setMuted)
  const coins = useGameStore(s => s.coins)
  const maxLevel = useGameStore(s => s.maxLevel)
  const checkin = useGameStore(s => s.checkin)
  const challenges = useGameStore(s => s.challenges)
  const refreshGrid = useGameStore(s => s.refreshGrid)
  const openZoneGallery = useUiStore(s => s.openZoneGallery)
  const openStats = useUiStore(s => s.openStats)
  const openCheckin = useUiStore(s => s.openCheckin)
  const setTab = useUiStore(s => s.setTab)
  const currentZone = useGameStore(s => s.currentZone)
  const pushToast = useUiStore(s => s.pushToast)

  const checkedToday = hasCheckedInToday(checkin)
  const weekend = isWeekendDouble()
  const buff = computeBuff(currentZone)
  const challengesDone = challenges.filter((c: any) => c._claimed).length
  const challengesAll = challenges.length
  const challengesPending = challengesAll - challengesDone

  // 锁 body scroll
  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [open])

  // ESC 关闭 + 屏幕右滑 24px 边缘手势
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, setOpen])

  // 屏幕右滑 24px 边缘手势
  const [touchStart, setTouchStart] = useReactState<{ x: number; y: number } | null>(null)
  const onTouchStart = (e: React.TouchEvent) => {
    const t = e.touches[0]
    if (!t) return
    setTouchStart({ x: t.clientX, y: t.clientY })
  }
  const onTouchEnd = (e: React.TouchEvent) => {
    if (!touchStart) return
    const t = e.changedTouches[0]
    if (!t) return
    const dx = t.clientX - touchStart.x
    const dy = Math.abs(t.clientY - touchStart.y)
    if (touchStart.x > window.innerWidth - 24 && dx > 60 && dy < 40) {
      setOpen(false)
    }
    setTouchStart(null)
  }

  if (!open) return null

  const drawerAction = (fn: () => void) => () => {
    fn()
    setOpen(false)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end"
      style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)' }}
      onClick={() => setOpen(false)}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      <div
        className="flex h-full w-72 max-w-[80vw] flex-col gap-2 overflow-y-auto p-4"
        style={{
          background: 'linear-gradient(160deg, rgba(40,30,70,0.97) 0%, rgba(20,15,40,0.97) 100%)',
          borderLeft: '1px solid rgba(167,139,250,0.5)',
          boxShadow: '-8px 0 24px rgba(167,139,250,0.3)',
          animation: 'drawerSlide 0.3s ease-out',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <style>{`
          @keyframes drawerSlide {
            from { transform: translateX(100%); }
            to   { transform: translateX(0); }
          }
        `}</style>

        {/* 头部 */}
        <div className="flex items-center gap-2 pb-1">
          <span className="text-base">⚙️</span>
          <span className="text-sm font-bold text-violet-200">设置</span>
          <button
            onClick={() => setOpen(false)}
            className="ml-auto text-white/50 active:scale-95"
            title="关闭（ESC / 点击空白 / 屏幕右滑）"
          >
            ✕
          </button>
        </div>

        {/* 顶部：今日活动（运营位） */}
        <div
          className="rounded-xl p-2 text-[10px]"
          style={{
            background: 'linear-gradient(90deg, rgba(167,139,250,0.15), rgba(96,165,250,0.15))',
            border: '1px solid rgba(167,139,250,0.3)',
          }}
        >
          <div className="mb-1 flex items-center gap-1 font-bold text-violet-200">
            <span>{seasonEmoji(buff.season)}</span>
            <span>{seasonLabel(buff.season)}季</span>
            {weekend && <span className="rounded-full bg-rose-500/30 px-1 text-rose-300">周末双倍</span>}
          </div>
          <div className="text-white/60">
            🍀 幸运主题：<span className="font-bold text-emerald-300">{buff.luckyZoneName}</span>
            {buff.multiplier > 1 && <> · ×<span className="font-mono text-violet-300">{buff.multiplier}</span></>}
          </div>
        </div>

        {/* 核心入口 1: 签到（红点角标） */}
        <DrawerItem
          emoji="🎁"
          label="每日签到"
          right={
            <div className="flex items-center gap-1">
              <span className="font-mono text-[10px] text-amber-300">{checkin.streak}/7</span>
              {!checkedToday && <span className="h-2 w-2 animate-pulse rounded-full bg-red-500" />}
            </div>
          }
          onClick={drawerAction(openCheckin)}
        />

        {/* 核心入口 2: 主题馆 */}
        <DrawerItem emoji="🗺️" label="主题馆" right={<span className="text-[9px] text-white/40">12 界</span>} onClick={drawerAction(openZoneGallery)} />

        {/* 核心入口 3: 统计 */}
        <DrawerItem emoji="📊" label="统计" onClick={drawerAction(openStats)} />

        {/* 核心入口 4: 挑战 */}
        <DrawerItem
          emoji="🎯"
          label="7 日挑战"
          right={
            <div className="flex items-center gap-1">
              <span className="font-mono text-[10px] text-white/60">{challengesDone}/{challengesAll}</span>
              {challengesPending > 0 && <span className="rounded-full bg-amber-500/80 px-1 text-[8px] font-bold text-white">!</span>}
            </div>
          }
          onClick={drawerAction(() => setTab('home' as any))}
        />

        {/* 操作入口 1: 最高等级（信息展示） */}
        <div
          className="flex items-center gap-2 rounded-xl px-3 py-2 text-[11px]"
          style={{ background: 'rgba(255,255,255,0.04)' }}
        >
          <span className="text-sm">👑</span>
          <span className="text-white/80">最高等级</span>
          <span className="ml-auto font-mono font-bold text-amber-300">Lv.{maxLevel}</span>
        </div>

        {/* 操作入口 2: 刷新网格 */}
        <DrawerItem
          emoji="🔄"
          label="刷新网格"
          right={
            <div className="flex items-center gap-1">
              <span className="text-[9px] text-amber-300">-5🪙</span>
              {coins < 5 && <span className="text-[9px] text-red-400">余额不足</span>}
            </div>
          }
          onClick={() => {
            if (coins < 5) {
              pushToast('🪙 扭蛋币不足', '🪙', 0)
              setOpen(false)
              return
            }
            refreshGrid(5)
            pushToast('🔄 刷新网格 -5🪙', '🔄', 0)
            setOpen(false)
          }}
        />

        {/* 操作入口 3: 立即扭蛋 */}
        <DrawerItem
          emoji="🎲"
          label="立即扭蛋"
          right={<span className="text-[9px] text-violet-300">-1🪙</span>}
          onClick={() => {
            setTab('home')
            setOpen(false)
            // 主扭蛋按钮在 home tab，焦点在扭蛋机
            setTimeout(() => {
              const el = document.querySelector('[data-gashapon-trigger]') as HTMLElement | null
              el?.click()
            }, 200)
          }}
        />

        {/* 静音开关 */}
        <DrawerItem
          emoji={muted ? '🔇' : '🔊'}
          label="音效"
          right={
            <button
              onClick={(e) => { e.stopPropagation(); setMuted(!muted) }}
              className={`relative h-4 w-7 rounded-full transition-all ${muted ? 'bg-white/10' : 'bg-violet-500'}`}
            >
              <div className={`absolute top-0.5 h-3 w-3 rounded-full bg-white transition-all ${muted ? 'left-0.5' : 'left-3.5'}`} />
            </button>
          }
          onClick={() => setMuted(!muted)}
        />

        {/* v13.0 重开一局（红色 + 1px 分割线区隔） */}
        <div className="my-2 h-px bg-white/5" />
        <button
          onClick={() => {
            setConfirmResetOpen(true)
            setOpen(false)
          }}
          className="flex items-center gap-2 rounded-xl px-3 py-2 text-[11px] font-bold text-rose-200 active:scale-95"
          style={{
            background: 'linear-gradient(90deg, rgba(244,63,94,0.2), rgba(236,72,153,0.2))',
            border: '1px solid rgba(244,63,94,0.4)',
          }}
          title="清空全部进度，保留收藏和已读（送 +50🪙）"
        >
          <span className="text-sm">🔁</span>
          <span>重开一局</span>
          <span className="ml-auto text-[9px] text-rose-300">清空进度</span>
        </button>

        {/* 提示 */}
        <div className="mt-2 rounded-xl bg-white/[0.03] p-2 text-[9px] text-white/40">
          <div className="mb-1 text-[10px] font-bold text-white/60">💡 v12 提示</div>
          <ul className="space-y-0.5">
            <li>· v12.0 删了起点光球 → 紫青三角箭头</li>
            <li>· v12.1 顶部 0 堆叠 → 所有次要入口在这里</li>
            <li>· 1/2/3/4 切 tab，←→ 切主题，ESC 关闭</li>
            <li>· 屏幕右滑也可关闭抽屉</li>
          </ul>
        </div>
      </div>

      {/* v13.0 重开二次确认 modal（抽屉内挂载，关闭抽屉后 modal 仍可显示） */}
      <ResetConfirmModal />
    </div>
  )
}

function DrawerItem({ emoji, label, right, onClick }: { emoji: string; label: string; right?: React.ReactNode; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 rounded-xl px-3 py-2 text-[11px] text-white/85 transition-all active:scale-[0.98] hover:bg-white/[0.06]"
      style={{ background: 'rgba(255,255,255,0.04)' }}
    >
      <span className="text-sm">{emoji}</span>
      <span>{label}</span>
      {right && <span className="ml-auto">{right}</span>}
    </button>
  )
}
