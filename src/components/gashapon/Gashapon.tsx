/**
 * 扭蛋机：3D 立体感 + GSAP 摇动 + 出蛋动画（v0.8：限定蛋壳 + 神赐事件）
 */
import { useRef, useState } from 'react'
import gsap from 'gsap'
import { useGameStore } from '@/store/gameStore'
import { useUiStore } from '@/store/uiStore'
import { ZONES } from '@/data/emoji-trees'
import { sfx, resumeAudio } from '@/lib/audio'
import { rollSpecialEgg, getSpecialEggById, ROLL_DIVINE_BLESSING, DIVINE_MIN_LEVEL, type SpecialEgg } from '@/lib/special-eggs'
import { nextId, rng } from '@/lib/rng'
import { placeCapsule } from '@/lib/merge-engine'

interface GashaponProps {
  onPulled?: (count: number) => void
}

export function Gashapon({ onPulled }: GashaponProps) {
  const coins = useGameStore(s => s.coins)
  const pull = useGameStore(s => s.pull)
  const currentZone = useGameStore(s => s.currentZone)
  const grid = useGameStore(s => s.grid)
  const setGrid = (g: typeof grid) => useGameStore.setState({ grid: g })
  const totalPulls = useGameStore(s => s.totalPulls)
  const advanceTutorial = useGameStore(s => s.advanceTutorial)
  const tutorialStep = useGameStore(s => s.tutorialStep)
  const setGuide = useUiStore(s => s.setGuide)
  const pushToast = useUiStore(s => s.pushToast)
  const burstConfetti = useUiStore(s => s.burstConfetti)
  const petLevel = useGameStore(s => s.pet?.level ?? 0)
  const freeGachaPending = useGameStore(s => s.freeGachaPending)

  const zone = ZONES[currentZone]
  const machineRef = useRef<HTMLDivElement>(null)
  const leverRef = useRef<HTMLDivElement>(null)
  const domeRef = useRef<HTMLDivElement>(null)
  const eggRef = useRef<HTMLDivElement>(null)
  const coinRef = useRef<HTMLDivElement>(null)
  const [busy, setBusy] = useState(false)
  const [previewEmoji, setPreviewEmoji] = useState<string | null>(null)
  const [currentEgg, setCurrentEgg] = useState<SpecialEgg | null>(null)

  const handlePull = async (multi: number) => {
    if (busy) return
    // v0.7 gacha_frenzy 事件期间免单
    const isFree = freeGachaPending
    const cost = isFree ? 0 : multi
    if (coins < cost) {
      setGuide('扭蛋币不足，去合成一些 emoji 吧！')
      sfx.fail()
      return
    }
    if (isFree) {
      useGameStore.setState({ freeGachaPending: false })
    }
    resumeAudio()
    setBusy(true)
    // v0.8：抽取限定蛋壳
    const egg = rollSpecialEgg()
    setCurrentEgg(egg)
    const m = machineRef.current
    if (!m) {
      setBusy(false)
      return
    }

    // 1. 摇杆
    sfx.lever()
    if (leverRef.current) {
      gsap.to(leverRef.current, { rotation: 22, y: 4, duration: 0.15, yoyo: true, repeat: 1 })
    }
    // 2. 机器摇晃 + 投币
    gsap.to(m, { x: -3, duration: 0.05, repeat: 9, yoyo: true })
    if (coinRef.current) {
      gsap.fromTo(
        coinRef.current,
        { y: -20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.25, onComplete: () => {
          gsap.to(coinRef.current, { y: 20, opacity: 0, duration: 0.3 })
        }}
      )
    }
    await new Promise(r => setTimeout(r, 500))
    sfx.coin()
    // 3. 出蛋（限定蛋 → 不同动画）
    if (eggRef.current) {
      const eggEl = eggRef.current
      gsap.set(eggEl, { y: -50, opacity: 0, scale: 0.5 })
      gsap.to(eggEl, { y: 0, opacity: 1, scale: 1, duration: 0.3, ease: 'back.out(2)' })
      await new Promise(r => setTimeout(r, 350))
      // 裂开
      sfx.crack()
      gsap.to(eggEl, { rotation: 360, scale: 1.1, duration: 0.2, yoyo: true, repeat: 1 })
      await new Promise(r => setTimeout(r, 250))
    }

    // 4. 真正合成
    if (isFree) {
      useGameStore.setState({ coins: coins })  // 不扣币
    }
    pull(multi)
    sfx.merge(1)
    if (egg) {
      pushToast(`✨ ${egg.label}！+${egg.bonusCoins}🪙`, egg.emoji, egg.rarity === 'legend' ? 3 : 2)
      useGameStore.setState({ coins: useGameStore.getState().coins + egg.bonusCoins })
      burstConfetti()
    } else if (multi === 1) {
      pushToast('+1 扭蛋！', '🎰')
    } else {
      pushToast(`十连！+${multi}`, '🎰', 2)
    }
    if (multi >= 10) burstConfetti()

    // v0.8 神赐事件：8% 概率直接塞 Lv.6 棋子
    if (rng() < ROLL_DIVINE_BLESSING) {
      const cap = { id: nextId('tile'), zone: currentZone, level: DIVINE_MIN_LEVEL, bornAt: Date.now() }
      const result = placeCapsule(useGameStore.getState().grid, cap)
      setGrid(result.grid)
      pushToast(`🌟 神赐！+1 Lv.${DIVINE_MIN_LEVEL} 棋子`, '✨', 3)
      burstConfetti()
      sfx.celebrate()
    }

    if (tutorialStep === 1) {
      advanceTutorial()
      setGuide('✨ 不错！长按任意 emoji 拖到同等级合成')
    }

    onPulled?.(multi)
    setTimeout(() => setCurrentEgg(null), 800)
    setBusy(false)
  }

  return (
    <div className="flex flex-col items-center">
      {/* 机器外壳 */}
      <div
        ref={machineRef}
        className="relative h-[220px] w-[300px] select-none"
        style={{ touchAction: 'manipulation' }}
      >
        {/* 主体（v1.2：根据当前主题动态染色 + 主题 emoji 大水印） */}
        <div
          className="absolute inset-x-0 top-6 h-[200px] rounded-3xl shadow-2xl transition-colors duration-500"
          style={{
            background: `linear-gradient(165deg, ${zone.color}66 0%, ${zone.bg.replace('0.12', '0.35')} 50%, ${zone.glow} 100%)`,
            boxShadow: `0 16px 60px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.18), 0 0 30px ${zone.glow}`,
          }}
        >
          {/* v1.2 主题 emoji 大水印（半透明背景） */}
          <div
            className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden rounded-3xl"
            aria-hidden
          >
            <span
              className="select-none text-[200px] leading-none opacity-[0.10]"
              style={{ filter: 'blur(1px)' }}
            >
              {zone.icon}
            </span>
          </div>

          {/* 显示条 */}
          <div className="absolute left-4 right-4 top-3.5 z-10 flex h-6 items-center rounded-md bg-black/80 px-2.5 font-mono text-[10px] text-white/70 ring-1 ring-white/10">
            <span>✦ {zone.name} · 等待中</span>
          </div>

          {/* 圆顶展示窗 */}
          <div
            ref={domeRef}
            className="absolute left-5 right-5 top-[52px] z-10 h-[88px] overflow-hidden rounded-2xl ring-1 ring-white/15"
            style={{
              background: `radial-gradient(ellipse at 50% 35%, ${zone.glow} 0%, rgba(0,0,0,0.05) 60%)`,
              backdropFilter: 'blur(4px)',
            }}
          >
            <div className="flex h-full flex-col items-center justify-center">
              {previewEmoji ? (
                <span className="text-5xl drop-shadow-lg">{previewEmoji}</span>
              ) : (
                <>
                  <span className="text-4xl drop-shadow">{zone.icon}</span>
                  <span className="mt-1 text-[10px] text-white/50 font-bold tracking-wider">{zone.subtitle}</span>
                </>
              )}
            </div>
          </div>

          {/* 出蛋口 */}
          <div className="absolute left-1/2 top-[148px] z-10 h-2.5 w-5 -translate-x-1/2 rounded-sm bg-black/60 ring-1 ring-black/40" />

          {/* 投币动画 */}
          <div
            ref={coinRef}
            className="pointer-events-none absolute left-1/2 top-[148px] z-10 h-4 w-4 -translate-x-1/2 rounded-full opacity-0"
            style={{
              background: 'radial-gradient(circle at 35% 35%, #ffd700, #c8a000)',
              boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
            }}
          />

          {/* 蛋（v1.2 蛋壳内部含主题 emoji 水印） */}
          <div
            ref={eggRef}
            className={`pointer-events-none absolute left-1/2 top-[178px] z-10 -translate-x-1/2 ${currentEgg ? 'egg-shimmer' : ''}`}
            style={currentEgg ? {
              fontSize: '40px',
              filter: `drop-shadow(0 0 12px ${currentEgg.shellColors[1]})`,
            } : { fontSize: '30px' }}
          >
            {currentEgg ? currentEgg.emoji : '🥚'}
            {/* v1.2 蛋壳内部主题 emoji 水印 */}
            {currentEgg && (
              <span
                className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-base opacity-50"
                style={{ filter: 'blur(0.4px)' }}
              >
                {zone.icon}
              </span>
            )}
          </div>
          {currentEgg && (
            <div
              className="pointer-events-none absolute left-1/2 top-[228px] z-10 -translate-x-1/2 whitespace-nowrap rounded-full px-2 py-0.5 text-[8px] font-bold tracking-wider text-white"
              style={{
                background: `linear-gradient(90deg, ${currentEgg.shellColors[0]}, ${currentEgg.shellColors[2]})`,
                boxShadow: `0 0 12px ${currentEgg.shellColors[1]}88`,
              }}
            >
              {currentEgg.label}
            </div>
          )}

          {/* 品牌 */}
          <div className="absolute bottom-2 left-0 right-0 z-10 text-center text-[8px] tracking-[0.2em] text-black/30 font-bold">
            · DRAG & MERGE ·
          </div>

          {/* 高光 */}
          <div className="pointer-events-none absolute inset-0 z-10 rounded-3xl bg-gradient-to-br from-white/[0.10] to-transparent" />
        </div>

        {/* 摇杆（v1.2 摇杆球也跟主题色） */}
        <div
          ref={leverRef}
          className="absolute right-[-18px] top-[60px] z-20 flex flex-col items-center"
          style={{ transformOrigin: '50% 100%' }}
        >
          <div
            className="h-5 w-5 rounded-full transition-colors duration-500"
            style={{
              background: `radial-gradient(circle at 35% 35%, ${zone.color}, ${zone.glow})`,
              boxShadow: `0 2px 6px rgba(0,0,0,0.4), inset 0 2px 4px rgba(255,255,255,0.3), 0 0 8px ${zone.glow}`,
            }}
          />
          <div className="-mt-0.5 h-8 w-1 rounded-sm bg-gradient-to-b from-gray-400 to-gray-600" />
        </div>
      </div>

      {/* 操作按钮 */}
      <div className="mt-3 flex w-full max-w-[300px] gap-2">
        <button
          onClick={() => handlePull(1)}
          disabled={busy}
          className="touch-target flex-1 rounded-xl bg-gradient-to-b from-ember-400 to-ember-600 py-2.5 text-sm font-bold text-white shadow-lg active:scale-95 disabled:opacity-50"
        >
          🎰 单抽 · 1 币
        </button>
        <button
          onClick={() => handlePull(10)}
          disabled={busy}
          className="touch-target flex-1 rounded-xl bg-gradient-to-b from-gold-400 to-gold-600 py-2.5 text-sm font-bold text-ink-900 shadow-lg active:scale-95 disabled:opacity-50"
        >
          ✨ 十连 · 9 币
        </button>
      </div>

      <div className="mt-2 text-[10px] text-white/30">
        累计 {totalPulls} 抽 · 宠物 Lv.{petLevel} 加成高等级概率
      </div>
    </div>
  )
}
