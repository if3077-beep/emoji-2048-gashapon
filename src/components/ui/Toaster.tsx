/**
 * 飘字提示
 */
import { useUiStore } from '@/store/uiStore'

export function Toaster() {
  const toasts = useUiStore(s => s.toasts)
  return (
    <div className="pointer-events-none fixed inset-x-0 top-24 z-50 flex flex-col items-center gap-2">
      {toasts.map(t => (
        <div
          key={t.id}
          className={`animate-pop rounded-full px-4 py-2 text-sm font-medium backdrop-blur-md ${
            t.tier === 3
              ? 'bg-gradient-to-r from-gold-500/40 to-ember-500/40 text-gold-400 ring-1 ring-gold-400/50'
              : t.tier === 2
              ? 'bg-purple-500/20 text-purple-300 ring-1 ring-purple-400/40'
              : t.tier === 1
              ? 'bg-blue-500/20 text-blue-300 ring-1 ring-blue-400/40'
              : 'bg-white/10 text-white/90 ring-1 ring-white/15'
          }`}
        >
          {t.emoji && <span className="mr-1.5">{t.emoji}</span>}
          {t.text}
        </div>
      ))}
    </div>
  )
}
