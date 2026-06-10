/**
 * v0.8 Dpad 方向按钮
 * - 网格下方 4 个固定方向按钮 ↑↓←→
 * - 同时保留滑动手势
 * - 移动端友好（thumb-zone 内）
 * - v2.2 支持 hint 高亮
 */
type Dir = 'up' | 'down' | 'left' | 'right'

const ARROW: Record<Dir, string> = {
  up: '↑', down: '↓', left: '←', right: '→',
}

interface DpadProps {
  onSwipe: (dir: Dir, fromX?: number, fromY?: number) => void
  /** v2.2 高亮当前 hint 方向 */
  hintDir?: Dir | null
}

export function Dpad({ onSwipe, hintDir }: DpadProps) {
  const cls = (d: Dir) =>
    `touch-target flex h-10 w-10 items-center justify-center rounded-xl text-xl ring-1 transition-all ${
      hintDir === d
        ? 'bg-gold-500 text-white ring-gold-300 animate-pulse scale-110 shadow-[0_0_18px_rgba(251,191,36,0.8)]'
        : 'bg-white/10 text-white/70 ring-white/10 active:scale-90 active:bg-white/20'
    }`
  return (
    <div className="flex w-full max-w-[360px] items-center justify-center gap-2 select-none">
      <div className="grid grid-cols-3 grid-rows-2 gap-1.5">
        <div />
        <button onClick={() => onSwipe('up')} className={cls('up')}>{ARROW.up}</button>
        <div />
        <button onClick={() => onSwipe('left')} className={cls('left')}>{ARROW.left}</button>
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/[0.03] text-[10px] text-white/30 ring-1 ring-white/5">
          4×4
        </div>
        <button onClick={() => onSwipe('right')} className={cls('right')}>{ARROW.right}</button>
        <div />
        <button onClick={() => onSwipe('down')} className={cls('down')}>{ARROW.down}</button>
        <div />
      </div>
    </div>
  )
}
