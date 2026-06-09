/**
 * 分享面板 v0.6
 * - Canvas 生成 9:16 卡片
 * - 下载 / 复制到剪贴板
 */
import { useEffect, useState } from 'react'
import { useGameStore } from '@/store/gameStore'
import { useUiStore } from '@/store/uiStore'
import { renderShareCard, downloadShareCard } from '@/lib/share-card'
import { ZONES, type ZoneId } from '@/data/emoji-trees'

export function SharePanel() {
  const show = useUiStore(s => s.showShare)
  const close = useUiStore(s => s.closeShare)
  const card = useUiStore(s => s.shareCard)
  const setCard = useUiStore(s => s.setShareCard)
  const pet = useGameStore(s => s.pet)
  const mergeCount = useGameStore(s => s.mergeCount)
  const bestCombo = useGameStore(s => s.bestCombo)
  const [dataUrl, setDataUrl] = useState<string | null>(null)
  const pushToast = useUiStore(s => s.pushToast)
  const setGuide = useUiStore(s => s.setGuide)

  useEffect(() => {
    if (show && card) {
      const url = renderShareCard({
        emoji: card.emoji,
        level: card.level,
        zone: card.title as any,  // 这里用 title 反推不严谨，先简化
        zoneName: card.title,
        playerName: '我',
        petEmoji: pet?.speciesEmoji,
        mergeCount,
        bestCombo,
      })
      setDataUrl(url)
    } else {
      setDataUrl(null)
    }
  }, [show, card, pet, mergeCount, bestCombo])

  if (!show || !card) return null

  const onDownload = () => {
    if (!dataUrl) return
    downloadShareCard(dataUrl, `emoji-2048-${card.title}-${card.level}.png`)
    pushToast('📥 卡片已下载', '🖼️', 1)
  }

  const onCopy = async () => {
    const text = `🌟 我在「扭蛋 2048」合成了 ${card.emoji} ${card.title}（${card.level >= 12 ? '醒·' + (card.level - 11) + '阶' : 'Lv.' + card.level}）！\n👉 if3077-beep.github.io/emoji-2048-gashapon`
    try {
      await navigator.clipboard.writeText(text)
      pushToast('📋 文案已复制', '✨', 1)
    } catch {
      pushToast('复制失败', '😢', 0)
    }
  }

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/60 backdrop-blur-sm sm:items-center" onClick={close}>
      <div
        className="relative flex w-full max-w-[400px] flex-col glass-strong rounded-t-3xl p-5 sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between">
          <div>
            <div className="text-base font-bold text-white/90">🖼️ 分享你的成就</div>
            <div className="mt-0.5 text-[10px] text-white/40">9:16 高清卡片 · 可下载可复制</div>
          </div>
          <button onClick={close} className="flex h-9 w-9 items-center justify-center rounded-full bg-white/5 text-white/60 active:scale-95" aria-label="关闭">✕</button>
        </div>

        {/* 卡片预览 */}
        <div className="mb-3 flex justify-center">
          {dataUrl ? (
            <img src={dataUrl} alt="share" className="max-h-[420px] rounded-2xl shadow-lg" />
          ) : (
            <div className="flex h-[420px] w-[240px] items-center justify-center rounded-2xl bg-white/5 text-white/30">
              生成中...
            </div>
          )}
        </div>

        {/* 按钮 */}
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={onDownload}
            className="touch-target rounded-full bg-gradient-to-r from-gold-500 to-ember-500 py-2.5 text-sm font-bold text-ink-900 active:scale-95"
          >
            📥 下载 PNG
          </button>
          <button
            onClick={onCopy}
            className="touch-target rounded-full bg-white/10 py-2.5 text-sm font-bold text-white/80 active:scale-95"
          >
            📋 复制文案
          </button>
        </div>

        <div className="mt-3 text-center text-[9px] text-white/30">
          长按图片可保存到相册 / 分享给朋友
        </div>
      </div>
    </div>
  )
}
