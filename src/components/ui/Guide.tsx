/**
 * 新手引导
 */
import { useUiStore } from '@/store/uiStore'

export function Guide() {
  const g = useUiStore(s => s.showGuide)
  if (!g) return null
  return (
    <div className="pointer-events-none fixed left-1/2 top-1/3 z-40 -translate-x-1/2 -translate-y-1/2 animate-pop">
      <div className="rounded-2xl bg-black/60 px-5 py-2.5 text-sm text-white/80 backdrop-blur-md ring-1 ring-white/10">
        {g}
      </div>
    </div>
  )
}
