/**
 * v0.9 视觉打磨工具
 * - 统一 GSAP 缓动
 * - 共用粒子动效
 */
import gsap from 'gsap'

/** v0.9 缓动统一 */
export const EASE = {
  pop: 'back.out(1.7)',
  slide: 'power3.out',
  bounce: 'bounce.out',
  smooth: 'sine.inOut',
  elastic: 'elastic.out(1, 0.3)',
} as const

/** 抖动效果（屏幕震动） */
export const shake = (target: gsap.TweenTarget, intensity = 8, duration = 0.4) => {
  gsap.fromTo(target, { x: 0, y: 0 }, {
    x: intensity,
    y: -intensity / 2,
    duration: 0.05,
    repeat: 7,
    yoyo: true,
    ease: 'sine.inOut',
    onComplete: () => gsap.to(target, { x: 0, y: 0, duration: 0.2 }),
  })
}

/** 爆裂粒子：从中心向四周喷射 */
export const burstParticles = (container: HTMLElement, x: number, y: number, count = 12, color = '#fbbf24') => {
  for (let i = 0; i < count; i++) {
    const p = document.createElement('div')
    p.className = 'pointer-events-none fixed z-50'
    p.style.cssText = `
      left: ${x}px; top: ${y}px;
      width: 6px; height: 6px;
      background: ${color};
      border-radius: 50%;
      box-shadow: 0 0 8px ${color};
    `
    document.body.appendChild(p)
    const angle = (i / count) * Math.PI * 2
    const dist = 60 + Math.random() * 40
    gsap.to(p, {
      x: Math.cos(angle) * dist,
      y: Math.sin(angle) * dist,
      opacity: 0,
      scale: 0.2,
      duration: 0.6 + Math.random() * 0.3,
      ease: EASE.smooth,
      onComplete: () => p.remove(),
    })
  }
}

/** 浮动文字（向上飘） */
export const floatText = (x: number, y: number, text: string, color = '#fbbf24') => {
  const el = document.createElement('div')
  el.className = 'pointer-events-none fixed z-50 font-bold text-lg'
  el.style.cssText = `
    left: ${x}px; top: ${y}px;
    color: ${color};
    text-shadow: 0 0 8px ${color}, 0 2px 4px rgba(0,0,0,0.4);
    transform: translate(-50%, -50%);
  `
  el.textContent = text
  document.body.appendChild(el)
  gsap.fromTo(el, { y: 0, opacity: 0, scale: 0.5 }, {
    y: -50,
    opacity: 1,
    scale: 1.2,
    duration: 0.3,
    ease: EASE.pop,
    onComplete: () => {
      gsap.to(el, { y: -100, opacity: 0, duration: 0.6, ease: EASE.smooth, onComplete: () => el.remove() })
    },
  })
}
