/**
 * 回归欢迎弹窗（v0.4）
 * - 上次登录 > 24h → 宠物"想你" + 大礼包
 * - 礼包按天数分级（1-2天小礼 / 3-6天中礼 / 7+天大礼）
 */
import { useEffect } from 'react'
import gsap from 'gsap'
import { useGameStore } from '@/store/gameStore'
import { useUiStore } from '@/store/uiStore'

export function ComebackModal() {
  const cb = useGameStore(s => s.pendingComeback)
  const claim = useGameStore(s => s.claimComeback)
  const pet = useGameStore(s => s.pet)
  const burstConfetti = useUiStore(s => s.burstConfetti)
  const pushToast = useUiStore(s => s.pushToast)

  useEffect(() => {
    if (cb) {
      gsap.fromTo(
        '.comeback-card',
        { scale: 0.7, opacity: 0 },
        { scale: 1, opacity: 1, duration: 0.5, ease: 'back.out(1.5)' },
      )
    }
  }, [cb])

  if (!cb) return null

  const onClaim = () => {
    claim()
    burstConfetti()
    pushToast(
      cb.daysSince >= 3 ? '🎁 大礼包已领！' : '💝 宠物想你啦~',
      cb.daysSince >= 7 ? '🌟' : '💕',
      cb.daysSince >= 3 ? 3 : 2,
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={onClaim}>
      <div
        className="comeback-card flex w-[320px] flex-col items-center gap-3 rounded-3xl p-6 text-center"
        style={{
          background: 'linear-gradient(135deg, rgba(251,191,36,0.2), rgba(167,139,250,0.2))',
          border: '1px solid rgba(251,191,36,0.4)',
          boxShadow: '0 0 40px rgba(251,191,36,0.3)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-6xl animate-bounce">{pet ? pet.speciesEmoji : '🐾'}</div>
        <div className="text-lg font-bold text-white/90">
          {pet ? `${pet.name} 想你啦！` : '欢迎回来！'}
        </div>
        <div className="text-xs text-white/60">已经 <span className="text-gold-400 font-bold">{cb.daysSince}</span> 天没见了</div>

        <div className="my-2 flex flex-col items-center gap-1 rounded-2xl bg-black/20 px-4 py-2.5">
          <div className="text-[10px] text-white/50">回归大礼包</div>
          <div className="flex items-center gap-3 text-xs">
            <span>🪙 <span className="text-gold-400 font-bold">+{cb.reward.coins}</span></span>
            {cb.reward.gacha > 0 && <span>🎰 <span className="text-ember-400 font-bold">+{cb.reward.gacha}</span></span>}
            {cb.reward.mythic > 0 && <span>🌟 <span className="text-purple-400 font-bold">+{cb.reward.mythic}</span></span>}
          </div>
        </div>

        <button
          onClick={onClaim}
          className="touch-target w-full rounded-full bg-gradient-to-r from-gold-500 to-ember-500 py-2.5 text-sm font-bold text-ink-900 shadow-lg active:scale-95"
        >
          {pet ? `收下 ${pet.name} 的礼物` : '收下礼物'}
        </button>
      </div>
    </div>
  )
}
