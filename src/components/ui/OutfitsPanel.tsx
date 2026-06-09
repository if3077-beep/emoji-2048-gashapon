/**
 * 装扮面板 v0.5
 * - 7 套装扮（3 套基础 + 4 套限定）
 * - 解锁条件达成后装备
 */
import { useState } from 'react'
import { useGameStore } from '@/store/gameStore'
import { useUiStore } from '@/store/uiStore'
import { OUTFITS, type OutfitId } from '@/lib/outfits'
import { ZONES, MAX_LEVEL } from '@/data/emoji-trees'

export function OutfitsPanel() {
  const show = useUiStore(s => s.showOutfits)
  const close = useUiStore(s => s.closeOutfits)
  const pet = useGameStore(s => s.pet)
  const zoneMax = useGameStore(s => s.zoneMax)
  const mergeCount = useGameStore(s => s.mergeCount)
  const awakenCount = useGameStore(s => s.pet?.awakenCount ?? 0)
  const checkin = useGameStore(s => s.checkin)
  const collection = useGameStore(s => s.collection)
  const maxLevel = useGameStore(s => s.maxLevel)
  const setPet = useGameStore(s => s.setPet)
  const [selected, setSelected] = useState<OutfitId | null>(null)

  if (!show) return null

  const isUnlocked = (id: OutfitId): boolean => {
    if (!pet) return false
    switch (id) {
      case 'crown': return Object.values(zoneMax).some(v => v >= MAX_LEVEL)
      case 'sun_crown': return checkin.unlockedOutfits.includes('sun_crown')
      case 'sakura': return checkin.unlockedOutfits.includes('sakura') || checkin.streak >= 5
      case 'party': return mergeCount >= 200
      case 'wizard': return awakenCount >= 5
      case 'cactus': return Object.values(collection).reduce((s, arr) => s + arr.length, 0) >= 30
      case 'rainbow': return Object.values(zoneMax).filter(v => v >= MAX_LEVEL).length >= 12
      default: return false
    }
  }

  const onEquip = (id: OutfitId) => {
    if (!pet || !isUnlocked(id)) return
    const updated = { ...pet, outfit: id } as any
    setPet(updated)
    setSelected(id)
  }

  const onUnequip = () => {
    if (!pet) return
    setPet({ ...pet, outfit: null } as any)
    setSelected(null)
  }

  const equipped = (pet as any)?.outfit ?? null

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/60 backdrop-blur-sm sm:items-center" onClick={close}>
      <div
        className="relative flex w-full max-w-[440px] flex-col glass-strong rounded-t-3xl p-5 sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between">
          <div>
            <div className="text-base font-bold text-white/90">👗 宠物装扮</div>
            <div className="mt-0.5 text-[10px] text-white/40">7 套装扮 · 解锁条件达成可装备</div>
          </div>
          <button onClick={close} className="flex h-9 w-9 items-center justify-center rounded-full bg-white/5 text-white/60 active:scale-95" aria-label="关闭">✕</button>
        </div>

        {!pet ? (
          <div className="py-8 text-center text-white/40 text-sm">
            🥚 还没有宠物<br />合成到 Lv.11 解锁宠物蛋
          </div>
        ) : (
          <>
            <div className="mb-3 flex flex-col items-center gap-1">
              <div className="text-5xl">{pet.speciesEmoji}</div>
              {equipped && <div className="text-2xl -mt-2">{OUTFITS.find(o => o.id === equipped)?.overlay}</div>}
              <div className="text-sm font-bold text-white/80">{pet.name}</div>
              <div className="text-[10px] text-white/40">{equipped ? `当前：${OUTFITS.find(o => o.id === equipped)?.name}` : '未装备'}</div>
              {equipped && (
                <button onClick={onUnequip} className="mt-1 text-[10px] text-white/40 underline">卸下</button>
              )}
            </div>

            <div className="grid grid-cols-3 gap-2">
              {OUTFITS.map(o => {
                const unlocked = isUnlocked(o.id)
                const equippedNow = equipped === o.id
                return (
                  <button
                    key={o.id}
                    onClick={() => unlocked && onEquip(o.id)}
                    disabled={!unlocked}
                    className="flex flex-col items-center gap-1 rounded-2xl p-3 transition-all active:scale-95"
                    style={{
                      background: equippedNow
                        ? 'linear-gradient(135deg, rgba(251,191,36,0.3), rgba(251,113,133,0.2))'
                        : unlocked
                          ? 'rgba(255,255,255,0.05)'
                          : 'rgba(255,255,255,0.02)',
                      border: equippedNow
                        ? '1px solid rgba(251,191,36,0.5)'
                        : unlocked
                          ? '1px solid rgba(255,255,255,0.1)'
                          : '1px dashed rgba(255,255,255,0.05)',
                      boxShadow: equippedNow ? '0 0 12px rgba(251,191,36,0.3)' : 'none',
                      opacity: unlocked ? 1 : 0.4,
                    }}
                  >
                    <div className="text-3xl">{unlocked ? o.overlay : '🔒'}</div>
                    <div className="text-[10px] font-bold text-white/80">{o.name}</div>
                    <div className="text-[8px] text-white/40 text-center leading-tight">
                      {o.unlockDesc}
                    </div>
                  </button>
                )
              })}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
