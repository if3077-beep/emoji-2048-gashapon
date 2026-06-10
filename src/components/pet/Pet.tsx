/**
 * 宠物：跟随鼠标/手指轨迹 + 互动
 * - requestAnimationFrame 缓动到目标位置
 * - 移动速度越快 → 倾斜越大
 * - 静止触发打哈欠、游走
 * - 点击触发随机动作
 * - 触屏有 0.2s 延迟
 */
import { useEffect, useRef, useState } from 'react'
import { useGameStore } from '@/store/gameStore'
import { useUiStore } from '@/store/uiStore'
import { sfx, resumeAudio } from '@/lib/audio'
import { feedPet, petPet, personalityBehavior, type Pet } from '@/lib/pet-gen'
import { OUTFITS, type OutfitId } from '@/lib/outfits'

const getOutfitOverlay = (id: OutfitId): string =>
  OUTFITS.find(o => o.id === id)?.overlay ?? ''

interface PetState {
  x: number
  y: number
  vx: number
  vy: number
  targetX: number
  targetY: number
  rotation: number
  scale: number
  action: 'idle' | 'wander' | 'yawn' | 'jump' | 'sad' | 'love'
  actionUntil: number
  lastMoveAt: number
  followLag: number  // 当前跟随延迟（受性格影响）
}

export function Pet() {
  const pet = useGameStore(s => s.pet)
  const updatePet = useGameStore(s => s.setPet)
  const setGuide = useUiStore(s => s.setGuide)
  const pushToast = useUiStore(s => s.pushToast)
  const updateTasks = useGameStore(s => s.updateTasks)
  const advanceTutorial = useGameStore(s => s.advanceTutorial)
  const tutorialStep = useGameStore(s => s.tutorialStep)

  const ref = useRef<HTMLDivElement>(null)
  const stateRef = useRef<PetState>({
    x: window.innerWidth - 120,
    y: window.innerHeight - 140,
    vx: 0,
    vy: 0,
    targetX: window.innerWidth - 120,
    targetY: window.innerHeight - 140,
    rotation: 0,
    scale: 1,
    action: 'idle',
    actionUntil: 0,
    lastMoveAt: Date.now(),
    followLag: 0.3,
  })
  const lastPointerRef = useRef({ x: 0, y: 0, t: 0, speed: 0 })
  const [tick, setTick] = useState(0)  // 强制重渲
  const [tooltip, setTooltip] = useState<string | null>(null)

  const behavior = pet ? personalityBehavior(pet.personality) : null

  // 跟随鼠标/触屏
  useEffect(() => {
    if (!pet) return
    stateRef.current.followLag = behavior?.lag ?? 0.3
    let raf = 0
    let last = performance.now()

    const onMove = (x: number, y: number, t: number) => {
      const last2 = lastPointerRef.current
      const dt = Math.max(1, t - last2.t)
      const dist = Math.hypot(x - last2.x, y - last2.y)
      const speed = dist / dt  // px/ms
      lastPointerRef.current = { x, y, t, speed }
      // 目标位置稍微偏离鼠标（避免完全重叠）
      stateRef.current.targetX = x - 30
      stateRef.current.targetY = y - 60
      stateRef.current.lastMoveAt = Date.now()
    }

    const onMouse = (e: MouseEvent) => onMove(e.clientX, e.clientY, performance.now())
    const onTouch = (e: TouchEvent) => {
      const t = e.touches[0]
      if (t) onMove(t.clientX, t.clientY, performance.now())
    }
    window.addEventListener('mousemove', onMouse)
    window.addEventListener('touchmove', onTouch, { passive: true })

    const animate = (now: number) => {
      const dt = Math.min(0.1, (now - last) / 1000)
      last = now
      const s = stateRef.current
      // 缓动
      const ease = 0.08
      s.x += (s.targetX - s.x) * ease
      s.y += (s.targetY - s.y) * ease
      s.vx = (s.targetX - s.x) * 60
      s.vy = (s.targetY - s.y) * 60
      // 倾斜
      const moveSpeed = Math.hypot(s.vx, s.vy)
      s.rotation = Math.atan2(s.vy, s.vx) * 0.05
      s.rotation = Math.max(-0.25, Math.min(0.25, s.rotation))

      // 静止行为
      const idleMs = Date.now() - s.lastMoveAt
      if (idleMs > (behavior?.idleYawn ?? 6) * 1000 && s.action === 'idle' && now > s.actionUntil) {
        s.action = 'yawn'
        s.actionUntil = now + 1200
      }
      if (idleMs > (behavior?.idleWander ?? 10) * 1000 && s.action === 'idle' && now > s.actionUntil) {
        // 游走到屏幕中心
        s.targetX = window.innerWidth / 2 - 30 + (Math.random() - 0.5) * 200
        s.targetY = window.innerHeight / 2 - 50 + (Math.random() - 0.5) * 100
        s.action = 'wander'
        s.actionUntil = now + 4000
        if (idleMs > 60000) {
          setTooltip('想你了…')
        }
      }

      setTick(t => t + 1)
      raf = requestAnimationFrame(animate)
    }
    raf = requestAnimationFrame(animate)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('mousemove', onMouse)
      window.removeEventListener('touchmove', onTouch)
    }
  }, [pet, behavior?.idleYawn, behavior?.idleWander, behavior?.lag])

  if (!pet || !behavior) return null

  const s = stateRef.current
  const size = 60 * pet.sizeScale

  const handleClick = () => {
    resumeAudio()
    type Action = PetState['action']
    const actions: Action[] = ['jump', 'love']
    const next: Action = actions[Math.floor(Math.random() * actions.length)] ?? 'jump'
    s.action = next
    s.actionUntil = performance.now() + 600
    sfx.tap()
    setTooltip(['(眨眼)', '(蹭蹭)', '(打滚)', '(摇尾)'][Math.floor(Math.random() * 4)] ?? '(眨眼)')
    setTimeout(() => setTooltip(null), 1200)
    // 抚摸加好感
    const r = petPet(pet)
    if (r.ready && r.pet.affection > pet.affection) {
      updatePet(r.pet)
      updateTasks(t => t.desc.includes('抚摸'), 1)
    }
    if (tutorialStep === 3) {
      advanceTutorial()
    }
  }

  const handleFeed = () => {
    if (useGameStore.getState().spendCoins(2)) {
      const r = feedPet(pet)
      updatePet(r.pet)
      sfx.feed()
      const s2 = stateRef.current
      s2.action = 'love'
      s2.actionUntil = performance.now() + 800
      const tipText = r.formChanged
        ? `✨ 进化为 ${r.newForm === 'baby' ? '幼崽' : r.newForm === 'adult' ? '成体' : r.newForm === 'awakened' ? '觉醒' : '新形态'}！+${r.reward ?? 0}🪙`
        : r.full ? '吃饱啦！' : r.evolved ? '升级了！' : '😋'
      setTooltip(tipText)
      setTimeout(() => setTooltip(null), 1500)
      if (r.evolved) sfx.evolve(r.pet.level)
      if (r.formChanged) sfx.celebrate()
      updateTasks(t => t.desc.includes('喂养'), 1)
      if (tutorialStep === 4) {
        advanceTutorial()
        setGuide('🎉 完美！再去合成 1 次，让宠物陪伴你继续')
      }
    } else {
      sfx.fail()
      setGuide('扭蛋币不足，先去合成！')
    }
  }

  const cssColor = `hsl(${pet.hue} ${pet.saturation}% ${pet.lightness}%)`

  // v1.1 心情计算：基于好感度（affection）+ 等级（level）+ form
  const mood = (() => {
    const a = pet.affection
    if (a >= 95) return { emoji: '🥰', label: '深爱' }
    if (a >= 80) return { emoji: '😋', label: '幸福' }
    if (a >= 60) return { emoji: '😊', label: '开心' }
    if (a >= 40) return { emoji: '😐', label: '平静' }
    if (a >= 20) return { emoji: '😟', label: '饿饿' }
    return { emoji: '😢', label: '难过' }
  })()

  return (
    <div
      ref={ref}
      className="pet-spring pointer-events-auto fixed z-30"
      style={{
        left: 0,
        top: 0,
        transform: `translate3d(${s.x}px, ${s.y}px, 0) rotate(${s.rotation}rad)`,
      }}
    >
      <div
        onClick={handleClick}
        onDoubleClick={handleFeed}
        className="relative cursor-pointer touch-target"
        style={{ width: size, height: size }}
      >
        {/* 光晕 */}
        <div
          className="absolute inset-0 rounded-full opacity-50 blur-xl"
          style={{ background: cssColor }}
        />
        {/* 宠物主体 */}
        <div
          className="relative flex h-full w-full items-center justify-center rounded-full text-[calc(40px*var(--pet-scale,1))] ring-2 ring-white/20"
          style={{
            background: `radial-gradient(circle at 35% 30%, hsl(${pet.hue} ${pet.saturation + 10}% ${pet.lightness + 20}%), ${cssColor})`,
            // CSS 变量供 emoji 大小
            ['--pet-scale' as any]: pet.sizeScale,
            transform: s.action === 'jump' ? 'translateY(-12px) scale(1.15)' : s.action === 'yawn' ? 'scale(0.95)' : 'scale(1)',
            transition: 'transform 0.3s cubic-bezier(.34,1.56,.64,1)',
          }}
        >
          <span className="text-4xl" style={{ fontSize: `${28 * pet.sizeScale}px` }}>{pet.speciesEmoji}</span>
        </div>
        {/* 装扮 overlay（v0.5） */}
        {(pet as any).outfit && (
          <div
            className="absolute -top-1 left-1/2 -translate-x-1/2"
            style={{ fontSize: `${20 * pet.sizeScale}px`, pointerEvents: 'none' }}
          >
            {getOutfitOverlay((pet as any).outfit)}
          </div>
        )}
        {/* 名字 + 心情 */}
        <div className="absolute -top-5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-black/60 px-2 py-0.5 text-[9px] text-white/70 ring-1 ring-white/10">
          {pet.name} · Lv.{pet.level} <span className="ml-0.5">{mood.emoji}</span>
        </div>
        {/* 爱心 */}
        {s.action === 'love' && (
          <div className="absolute -top-3 right-0 text-pink-400 animate-pop">💕</div>
        )}
        {/* 气泡 */}
        {tooltip && (
          <div className="absolute -top-9 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-white/90 px-2 py-0.5 text-[10px] text-ink-900 shadow animate-pop">
            {tooltip}
          </div>
        )}
        {/* 好感条 */}
        <div className="absolute -bottom-2 left-0 right-0 h-1 overflow-hidden rounded-full bg-black/40">
          <div
            className="h-full rounded-full transition-all"
            style={{
              width: `${pet.affection}%`,
              background: 'linear-gradient(90deg, #ff6b4a, #ff8a5b)',
            }}
          />
        </div>
      </div>

      {/* 右键/长按喂食 */}
      <button
        onClick={(e) => {
          e.stopPropagation()
          handleFeed()
        }}
        className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-gold-500 text-[10px] ring-2 ring-black/40"
        title="喂食 2 币"
      >
        🍖
      </button>
    </div>
  )
}
