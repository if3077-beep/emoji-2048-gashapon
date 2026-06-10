/**
 * v1.1 成就解锁祝贺弹层 → v4.1 展板 carousel 模式
 * - 单成就：正常展示 + 收下
 * - 多成就：carousel 模式，左右滑切换 + dots 指示器
 *   - "📋 全部 (N)" 按钮 → 展开右侧抽屉展柜，玩家可逐张预览
 *   - 抽屉底部"全部收下"按钮：一次撒花+清队列+成就音效
 */
import { useEffect, useState } from 'react'
import gsap from 'gsap'
import { useGameStore } from '@/store/gameStore'
import { useUiStore } from '@/store/uiStore'
import { CATEGORY_LABELS } from '@/lib/achievements'
import { sfx } from '@/lib/audio'

export function AchievementUnlockModal() {
  const current = useGameStore(s => s.currentAchievement)
  const dismiss = useGameStore(s => s.dismissCurrentAchievement)
  const pending = useGameStore(s => s.pendingAchievements)
  const clearAll = useGameStore(s => s.clearAchievementQueue)
  const burstConfetti = useUiStore(s => s.burstConfetti)
  const [showTray, setShowTray] = useState(false)  // v4.1 抽屉状态
  const [activeIdx, setActiveIdx] = useState(0)    // v4.1 carousel 索引

  useEffect(() => {
    if (current) {
      burstConfetti()
      gsap.fromTo(
        '.ach-card',
        { scale: 0.5, opacity: 0, y: 20 },
        { scale: 1, opacity: 1, y: 0, duration: 0.4, ease: 'back.out(1.4)' },
      )
      setActiveIdx(0)
    }
  }, [current?.id])

  if (!current) return null

  const meta = CATEGORY_LABELS[current.category]
  const totalCount = pending.length + 1  // 当前 + 队列
  const hasMultiple = totalCount > 1

  // v4.1 carousel：所有成就 = [current, ...pending]
  const all = [current, ...pending]
  const active = all[Math.min(activeIdx, all.length - 1)] ?? current

  // 切到下一个
  const next = () => {
    sfx.tap()
    if (activeIdx < all.length - 1) {
      setActiveIdx(activeIdx + 1)
    } else {
      // 最后一个 → 收下
      dismiss()
    }
  }
  const prev = () => {
    sfx.tap()
    if (activeIdx > 0) setActiveIdx(activeIdx - 1)
  }

  // 一键收下
  const handleClearAll = () => {
    sfx.achievement()
    burstConfetti()
    clearAll()
    setShowTray(false)
  }

  return (
    <div
      className="pointer-events-auto fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={dismiss}
    >
      <div
        className="ach-card relative w-[85vw] max-w-sm overflow-hidden rounded-3xl p-6 text-center shadow-2xl"
        style={{
          background: 'linear-gradient(160deg, rgba(251,191,36,0.18) 0%, rgba(167,139,250,0.15) 100%)',
          border: `2px solid ${meta.color}88`,
          boxShadow: `0 0 40px ${meta.color}66`,
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* 角标 */}
        <div className="absolute -top-1 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gold-500 px-3 py-1 text-[10px] font-bold text-ink-900">
          🏆 成就达成
        </div>

        {/* v4.1 多成就 chip 顶标 + 位置 */}
        {hasMultiple && (
          <div
            className="absolute right-3 top-3 rounded-full bg-gold-500/25 px-2.5 py-0.5 text-[10px] font-extrabold text-gold-200 ring-1 ring-gold-400/40"
            title="一次性解锁多个成就"
          >
            ✨ {activeIdx + 1} / {totalCount}
          </div>
        )}

        {/* 大图标（v4.1 用 active 让 carousel 切换时换图标） */}
        <div
          className="mx-auto mb-3 flex h-24 w-24 items-center justify-center rounded-full text-5xl"
          style={{ background: `${meta.color}25`, boxShadow: `0 0 24px ${meta.color}55`, transition: 'background 0.3s' }}
        >
          {active.icon}
        </div>

        {/* 分类 */}
        <div className="mb-1 text-[10px] font-bold tracking-widest" style={{ color: meta.color }}>
          {meta.icon} {meta.label}
        </div>

        {/* 标题 + 描述（v4.1 随 active 切换） */}
        <div className="text-xl font-bold text-white" key={`title-${active.id}`}>{active.title}</div>
        <div className="mt-1 text-[11px] text-white/60" key={`desc-${active.id}`}>{active.desc}</div>

        {/* 奖励 */}
        {active.reward > 0 && (
          <div
            className="mx-auto mt-4 inline-flex items-center gap-1.5 rounded-full bg-gold-500/30 px-4 py-1.5 text-sm font-bold text-gold-300"
            style={{ border: '1px solid rgba(251,191,36,0.45)' }}
          >
            <span>🪙</span>
            <span>+{active.reward}</span>
          </div>
        )}

        {/* v4.1 carousel 指示器 + 左右切换 */}
        {hasMultiple && (
          <div className="mt-4 flex items-center justify-center gap-2">
            <button
              onClick={prev}
              disabled={activeIdx === 0}
              className="touch-target flex h-7 w-7 items-center justify-center rounded-full bg-white/10 text-sm text-white/80 ring-1 ring-white/10 active:scale-90 disabled:opacity-30"
            >
              ‹
            </button>
            <div className="flex items-center gap-1">
              {all.map((a, i) => (
                <button
                  key={a.id}
                  onClick={() => { sfx.tap(); setActiveIdx(i) }}
                  className="h-1.5 rounded-full transition-all"
                  style={{
                    width: i === activeIdx ? 16 : 6,
                    background: i === activeIdx ? '#fbbf24' : 'rgba(255,255,255,0.2)',
                  }}
                />
              ))}
            </div>
            <button
              onClick={next}
              className="touch-target flex h-7 w-7 items-center justify-center rounded-full bg-white/10 text-sm text-white/80 ring-1 ring-white/10 active:scale-90"
            >
              ›
            </button>
          </div>
        )}

        {/* 队列摘要 */}
        {hasMultiple && (
          <div className="mt-3 text-[10px] text-white/40">
            共解锁 {totalCount} 个 · 总奖励 <span className="text-gold-300 font-bold">+{all.reduce((s, a) => s + a.reward, 0)} 🪙</span>
          </div>
        )}

        {/* 关闭按钮 */}
        <div className="mt-4 flex gap-2">
          {hasMultiple && (
            <button
              onClick={() => { sfx.tap(); setShowTray(true) }}
              className="touch-target flex-1 rounded-full bg-white/10 py-2.5 text-sm font-bold text-white active:scale-95"
              style={{ border: '1px solid rgba(255,255,255,0.15)' }}
              title="查看全部成就列表"
            >
              📋 全部
            </button>
          )}
          <button
            onClick={() => {
              sfx.tap()
              // 多成就时按"下一个"逻辑处理（最后一个会收下），单成就时直接收下
              if (hasMultiple && activeIdx < all.length - 1) {
                next()
              } else {
                dismiss()
              }
            }}
            className="touch-target flex-1 rounded-full bg-gold-500/30 py-2.5 text-sm font-bold text-gold-200 active:scale-95"
            style={{ border: '1px solid rgba(251,191,36,0.45)' }}
          >
            {hasMultiple ? (activeIdx < all.length - 1 ? '下一个 ›' : '收下奖励') : '收下奖励'}
          </button>
        </div>
      </div>

      {/* v4.1 右侧抽屉展柜：所有成就列表 */}
      {showTray && (
        <div
          className="pointer-events-auto fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
          onClick={() => setShowTray(false)}
        >
          <div
            className="absolute right-0 top-0 h-full w-[88vw] max-w-sm overflow-y-auto bg-gradient-to-b from-ink-800/95 to-ink-900/95 p-4 shadow-2xl"
            style={{ animation: 'traySlideIn 0.3s cubic-bezier(.34,1.56,.64,1)' }}
            onClick={e => e.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between">
              <div>
                <div className="text-sm font-extrabold text-gold-300">🏆 成就展柜</div>
                <div className="text-[10px] text-white/40">刚刚解锁的 {totalCount} 个成就</div>
              </div>
              <button
                onClick={() => setShowTray(false)}
                className="flex h-7 w-7 items-center justify-center rounded-full bg-white/10 text-white/70 active:scale-90"
              >
                ✕
              </button>
            </div>
            <div className="space-y-2">
              {all.map((a, i) => {
                const m = CATEGORY_LABELS[a.category]
                const isActive = i === activeIdx
                return (
                  <button
                    key={a.id}
                    onClick={() => { sfx.tap(); setActiveIdx(i); setShowTray(false) }}
                    className={`flex w-full items-center gap-3 rounded-2xl p-3 text-left active:scale-[0.98] transition-all ${isActive ? 'bg-gold-500/20 ring-1 ring-gold-400/50' : 'bg-white/[0.04] ring-1 ring-white/5'}`}
                  >
                    <div
                      className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-2xl"
                      style={{ background: `${m.color}25`, boxShadow: `0 0 14px ${m.color}44` }}
                    >
                      {a.icon}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 text-[9px] font-bold" style={{ color: m.color }}>
                        {m.icon} {m.label}
                      </div>
                      <div className="truncate text-sm font-bold text-white">{a.title}</div>
                      <div className="line-clamp-2 text-[10px] text-white/50">{a.desc}</div>
                    </div>
                    <div className="shrink-0 text-right">
                      {a.reward > 0 && (
                        <div className="text-xs font-extrabold text-gold-300">+{a.reward}</div>
                      )}
                      <div className="text-[9px] text-white/30">🪙</div>
                    </div>
                  </button>
                )
              })}
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <div className="rounded-2xl bg-white/[0.04] p-2.5 text-center">
                <div className="text-[9px] text-white/40">总奖励</div>
                <div className="text-base font-extrabold text-gold-300">+{all.reduce((s, a) => s + a.reward, 0)}</div>
              </div>
              <div className="rounded-2xl bg-white/[0.04] p-2.5 text-center">
                <div className="text-[9px] text-white/40">成数</div>
                <div className="text-base font-extrabold text-emerald-300">{totalCount}</div>
              </div>
            </div>
            <button
              onClick={handleClearAll}
              className="touch-target mt-4 w-full rounded-full bg-gradient-to-r from-gold-500 to-amber-500 py-3 text-sm font-extrabold text-ink-900 active:scale-95"
              style={{ boxShadow: '0 0 18px rgba(251,191,36,0.55)' }}
            >
              📋 全部收下（+{all.reduce((s, a) => s + a.reward, 0)} 🪙）
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes traySlideIn {
          from { transform: translateX(100%); }
          to   { transform: translateX(0); }
        }
      `}</style>
    </div>
  )
}
