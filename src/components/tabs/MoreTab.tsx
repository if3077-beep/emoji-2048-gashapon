/**
 * 更多 Tab：宠物详情、API 文案、设置、v0.5 入口、v0.6 分享+排行入口
 */
import { useEffect, useState } from 'react'
import { useGameStore } from '@/store/gameStore'
import { useUiStore } from '@/store/uiStore'
import { fetchOne, type ApiId } from '@/lib/api-client'
import { feedPet, petPet } from '@/lib/pet-gen'
import { clearSave } from '@/lib/persistence'
import { sfx, setMuted, isMuted } from '@/lib/audio'

export function MoreTab() {
  const pet = useGameStore(s => s.pet)
  const setPet = useGameStore(s => s.setPet)
  const spendCoins = useGameStore(s => s.spendCoins)
  const addCoins = useGameStore(s => s.addCoins)
  const muted = useUiStore(s => s.muted)
  const setMutedState = useUiStore(s => s.setMuted)
  const setGuide = useUiStore(s => s.setGuide)
  const pushToast = useUiStore(s => s.pushToast)

  const [apiText, setApiText] = useState<string>('加载中…')

  useEffect(() => {
    const ids: ApiId[] = ['love', 'chp', 'qinghua', 'shici', 'du']
    Promise.all(ids.map(id => fetchOne(id))).then(results => {
      const random = results[Math.floor(Math.random() * results.length)]
      setApiText(random || '今天也要开心哦~')
    })
  }, [])

  const handleFeed = () => {
    if (!pet) return
    if (spendCoins(2)) {
      const { pet: p2, evolved, full } = feedPet(pet)
      setPet(p2)
      sfx.feed()
      if (evolved) {
        sfx.evolve(p2.level)
        pushToast(`${p2.name} 升级了！`, '⬆️', 2)
      } else if (full) {
        pushToast(`${p2.name} 吃饱了！`, '💕')
      }
    } else {
      sfx.fail()
    }
  }

  const handleReset = () => {
    if (confirm('确认重置？所有进度将清空（不可恢复）。')) {
      clearSave()
      location.reload()
    }
  }

  const handleMuteToggle = () => {
    const next = !muted
    setMuted(next)
    setMutedState(next)
    setGuide(next ? '已静音' : '已开启音效')
  }

  return (
    <div className="flex w-full max-w-[420px] flex-col gap-3 px-3 py-2">
      {/* 宠物详情卡 */}
      <div className="glass rounded-2xl p-4">
        {pet ? (
          <>
            <div className="mb-2 flex items-center gap-3">
              <div
                className="flex h-16 w-16 items-center justify-center rounded-full text-3xl ring-2 ring-white/20"
                style={{
                  background: `radial-gradient(circle at 35% 30%, hsl(${pet.hue} ${pet.saturation + 10}% ${pet.lightness + 20}%), hsl(${pet.hue} ${pet.saturation}% ${pet.lightness}%))`,
                }}
              >
                {pet.speciesEmoji}
              </div>
              <div>
                <div className="text-base font-semibold text-white/90">{pet.name}</div>
                <div className="text-[10px] text-white/40">Lv.{pet.level} · {pet.personality}</div>
                <div className="text-[10px] text-white/30">
                  物种 {pet.species} · {pet.size}
                </div>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div>
                <div className="text-[10px] text-white/30">好感</div>
                <div className="font-mono text-sm text-ember-400">{pet.affection}</div>
              </div>
              <div>
                <div className="text-[10px] text-white/30">等级</div>
                <div className="font-mono text-sm text-gold-400">Lv.{pet.level}</div>
              </div>
              <div>
                <div className="text-[10px] text-white/30">孵化</div>
                <div className="font-mono text-[10px] text-white/50">
                  {new Date(pet.hatchedAt).toLocaleDateString()}
                </div>
              </div>
            </div>
            <div className="mt-3 flex gap-2">
              <button
                onClick={handleFeed}
                className="touch-target flex-1 rounded-full bg-gradient-to-b from-ember-400 to-ember-600 py-2 text-xs font-bold text-white"
              >
                🍖 喂食 (-2 币)
              </button>
              <button
                onClick={() => {
                  if (pet) {
                    const r = petPet(pet)
                    if (r.ready) setPet(r.pet)
                  }
                }}
                className="touch-target flex-1 rounded-full bg-white/10 py-2 text-xs font-medium text-white/80 ring-1 ring-white/10"
              >
                🤚 抚摸
              </button>
            </div>
          </>
        ) : (
          <div className="py-4 text-center text-sm text-white/50">
            🥚 还没有宠物
            <div className="mt-1 text-[10px] text-white/30">
              合成任意生态区到 Lv.10 即可获得宠物蛋
            </div>
          </div>
        )}
      </div>

      {/* API 文案 */}
      <div className="glass rounded-2xl p-3">
        <div className="mb-1 text-xs text-white/50">📡 今日一言</div>
        <div className="text-sm text-white/80 leading-relaxed">{apiText}</div>
        <div className="mt-1 text-[10px] text-white/30">数据来源：国内公益 API</div>
      </div>

      {/* v0.5 入口：装扮/成就/设置 */}
      <div className="grid grid-cols-3 gap-2">
        <button
          onClick={() => useUiStore.getState().openOutfits()}
          className="touch-target glass flex flex-col items-center gap-1 rounded-2xl p-3 active:scale-95"
        >
          <span className="text-2xl">👗</span>
          <span className="text-[10px] text-white/70">装扮</span>
        </button>
        <button
          onClick={() => useUiStore.getState().openAchievements()}
          className="touch-target glass flex flex-col items-center gap-1 rounded-2xl p-3 active:scale-95"
        >
          <span className="text-2xl">🏆</span>
          <span className="text-[10px] text-white/70">成就</span>
        </button>
        <button
          onClick={() => useUiStore.getState().openSettings()}
          className="touch-target glass flex flex-col items-center gap-1 rounded-2xl p-3 active:scale-95"
        >
          <span className="text-2xl">⚙️</span>
          <span className="text-[10px] text-white/70">设置</span>
        </button>
      </div>

      {/* v0.6 入口：分享/排行榜 */}
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={() => {
            const coins = useGameStore.getState().coins
            const maxLevel = useGameStore.getState().maxLevel
            useUiStore.getState().setShareCard({
              emoji: pet?.speciesEmoji ?? '🌟',
              level: maxLevel,
              title: `扭蛋 2048 · Lv.${maxLevel} · 🪙${coins}`,
            })
            useUiStore.getState().openShare()
          }}
          className="touch-target glass flex items-center gap-2 rounded-2xl p-3 active:scale-95"
        >
          <span className="text-2xl">📤</span>
          <div className="flex-1 text-left">
            <div className="text-xs text-white/80 font-medium">分享我的合成</div>
            <div className="text-[9px] text-white/40">生成 9:16 卡片</div>
          </div>
        </button>
        <button
          onClick={() => useUiStore.getState().openLeaderboard()}
          className="touch-target glass flex items-center gap-2 rounded-2xl p-3 active:scale-95"
        >
          <span className="text-2xl">🏅</span>
          <div className="flex-1 text-left">
            <div className="text-xs text-white/80 font-medium">本地排行榜</div>
            <div className="text-[9px] text-white/40">连击 / 等级 / 通关</div>
          </div>
        </button>
      </div>

      {/* 设置 */}
      <div className="glass rounded-2xl p-3">
        <div className="text-xs text-white/50 mb-2">⚙️ 设置</div>
        <div className="flex items-center justify-between py-1.5 text-sm">
          <span>音效</span>
          <button
            onClick={handleMuteToggle}
            className={`touch-target rounded-full px-3 py-0.5 text-xs ${
              muted ? 'bg-white/10 text-white/50' : 'bg-gold-500 text-ink-900'
            }`}
          >
            {muted ? '已关' : '已开'}
          </button>
        </div>
        <div className="flex items-center justify-between py-1.5 text-sm">
          <span>加币测试</span>
          <button
            onClick={() => {
              addCoins(50)
              pushToast('+50 测试币', '🪙')
            }}
            className="touch-target rounded-full bg-white/10 px-3 py-0.5 text-xs text-white/80 ring-1 ring-white/10"
          >
            +50
          </button>
        </div>
        <div className="flex items-center justify-between py-1.5 text-sm">
          <span className="text-red-400/70">重置进度</span>
          <button
            onClick={handleReset}
            className="touch-target rounded-full bg-red-500/10 px-3 py-0.5 text-xs text-red-300 ring-1 ring-red-400/20"
          >
            重置
          </button>
        </div>
      </div>

      <div className="pb-2 text-center text-[10px] text-white/20">
        扭蛋 2048 · 合成生态 · v0.6
      </div>
    </div>
  )
}
