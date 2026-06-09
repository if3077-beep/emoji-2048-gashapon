/**
 * 设置面板 v0.5
 * - 音乐 / 音效 / 震动 / 主题切换
 */
import { useUiStore } from '@/store/uiStore'
import { useGameStore } from '@/store/gameStore'
import { bgm } from '@/lib/bgm'

export function SettingsPanel() {
  const show = useUiStore(s => s.showSettings)
  const close = useUiStore(s => s.closeSettings)
  const muted = useUiStore(s => s.muted)
  const setMuted = useUiStore(s => s.setMuted)
  const reset = useGameStore(s => s.reset)
  const advanceTutorial = useGameStore(s => s.advanceTutorial)

  if (!show) return null

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/60 backdrop-blur-sm sm:items-center" onClick={close}>
      <div
        className="relative flex w-full max-w-[400px] flex-col glass-strong rounded-t-3xl p-5 sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between">
          <div className="text-base font-bold text-white/90">⚙️ 设置</div>
          <button onClick={close} className="flex h-9 w-9 items-center justify-center rounded-full bg-white/5 text-white/60 active:scale-95" aria-label="关闭">✕</button>
        </div>

        <div className="space-y-2">
          <Row
            icon="🔊"
            label="游戏音效"
            value={!muted}
            onChange={(v) => {
              setMuted(!v)
              if (v) bgm.setMuted(false)
              else bgm.setMuted(true)
            }}
          />
          <Row
            icon="🎵"
            label="背景音乐"
            value={!muted}
            onChange={(v) => {
              if (v) {
                bgm.setMuted(false)
                bgm.play()
              } else {
                bgm.stop()
              }
            }}
          />
          <Row icon="📳" label="震动反馈" value={true} onChange={() => {}} />
          <Row icon="🌗" label="深色模式（始终）" value={true} onChange={() => {}} disabled />
          <Row icon="🔁" label="重看教程" value={false} onChange={() => { advanceTutorial() }} />
        </div>

        <div className="mt-4 border-t border-white/5 pt-3">
          <button
            onClick={() => {
              if (confirm('确定要重置所有数据吗？此操作不可恢复！')) {
                reset()
                close()
              }
            }}
            className="w-full rounded-full bg-red-500/20 py-2 text-sm font-bold text-red-300 active:scale-95"
          >
            🗑️ 重置所有数据
          </button>
        </div>

        <div className="mt-3 text-center text-[9px] text-white/30">
          v0.5 · 合成生态 · 12 主题 · 50+ 成就
        </div>
      </div>
    </div>
  )
}

function Row({ icon, label, value, onChange, disabled }: { icon: string; label: string; value: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <div className="flex items-center justify-between rounded-2xl bg-white/[0.03] px-3 py-2.5">
      <div className="flex items-center gap-2">
        <span className="text-lg">{icon}</span>
        <span className={`text-sm ${disabled ? 'text-white/30' : 'text-white/80'}`}>{label}</span>
      </div>
      <button
        disabled={disabled}
        onClick={() => onChange(!value)}
        className="relative h-6 w-11 rounded-full transition-all"
        style={{
          background: value ? 'rgba(34,197,94,0.5)' : 'rgba(255,255,255,0.1)',
          opacity: disabled ? 0.4 : 1,
        }}
      >
        <span
          className="absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all"
          style={{ left: value ? '22px' : '2px' }}
        />
      </button>
    </div>
  )
}
