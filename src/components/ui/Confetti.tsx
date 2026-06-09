/**
 * 屏幕彩纸
 */
import { useUiStore } from '@/store/uiStore'
import { useMemo } from 'react'

const EMOJIS = ['🎉', '✨', '🌟', '💖', '🎊', '⭐', '🌈', '🍀']

export function Confetti() {
  const key = useUiStore(s => s.confettiKey)
  const pieces = useMemo(
    () =>
      Array.from({ length: 24 }, (_, i) => ({
        id: `${key}-${i}`,
        emoji: EMOJIS[i % EMOJIS.length]!,
        left: Math.random() * 100,
        delay: Math.random() * 0.3,
        duration: 1.4 + Math.random() * 0.8,
      })),
    [key],
  )
  if (key === 0) return null
  return (
    <div className="pointer-events-none fixed inset-0 z-40 overflow-hidden">
      {pieces.map(p => (
        <span
          key={p.id}
          className="absolute -top-4 text-2xl"
          style={{
            left: `${p.left}%`,
            animation: `confetti ${p.duration}s ${p.delay}s linear forwards`,
          }}
        >
          {p.emoji}
        </span>
      ))}
    </div>
  )
}
