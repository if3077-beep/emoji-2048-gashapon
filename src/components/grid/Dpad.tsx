/**
 * v0.8 Dpad 方向按钮
 * - 网格下方 4 个固定方向按钮 ↑↓←→
 * - 同时保留滑动手势
 * - 移动端友好（thumb-zone 内）
 */
import { useGameStore } from '@/store/gameStore'

type Dir = 'up' | 'down' | 'left' | 'right'

const ARROW: Record<Dir, string> = {
  up: '↑', down: '↓', left: '←', right: '→',
}

interface DpadProps {
  onSwipe: (dir: Dir, fromX?: number, fromY?: number) => void
}

export function Dpad({ onSwipe }: DpadProps) {
  const grid = useGameStore(s => s.grid)
  return (
    <div className="flex w-full max-w-[360px] items-center justify-center gap-2 select-none">
      <div className="grid grid-cols-3 grid-rows-2 gap-1.5">
        <div />
        <button
          onClick={() => onSwipe('up')}
          className="touch-target flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-xl text-white/70 ring-1 ring-white/10 active:scale-90 active:bg-white/20"
        >
          {ARROW.up}
        </button>
        <div />
        <button
          onClick={() => onSwipe('left')}
          className="touch-target flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-xl text-white/70 ring-1 ring-white/10 active:scale-90 active:bg-white/20"
        >
          {ARROW.left}
        </button>
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/[0.03] text-[10px] text-white/30 ring-1 ring-white/5">
          4×4
        </div>
        <button
          onClick={() => onSwipe('right')}
          className="touch-target flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-xl text-white/70 ring-1 ring-white/10 active:scale-90 active:bg-white/20"
        >
          {ARROW.right}
        </button>
        <div />
        <button
          onClick={() => onSwipe('down')}
          className="touch-target flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-xl text-white/70 ring-1 ring-white/10 active:scale-90 active:bg-white/20"
        >
          {ARROW.down}
        </button>
        <div />
      </div>
    </div>
  )
}
