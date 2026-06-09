/**
 * 事件奖励系统（v0.2）
 * 不同事件 → 不同基础奖励 → 系数叠加 → 总奖励
 * 慷慨 5-10 倍
 */

export type EventKind =
  | 'merge_basic'      // 普通合成
  | 'merge_combo'      // 连击合成
  | 'merge_first'      // 首次合成某等级
  | 'merge_rare'       // Lv5+ 稀有
  | 'merge_epic'       // Lv8+ 史诗
  | 'merge_mythic'     // Lv10+ 神话
  | 'merge_awaken'     // 觉醒
  | 'merge_awaken_t5'  // 觉醒·五阶
  | 'merge_awaken_t10' // 觉醒·十阶
  | 'merge_crit'       // 暴击（v0.3：5% 概率，奖励 ×5）
  | 'merge_lucky'      // 幸运区（v0.3：当前区是每日幸运区，奖励 ×1.5）
  | 'merge_season'     // 季节加成（v0.3：季节匹配区，奖励 ×2）
  | 'gacha_single'     // 单抽
  | 'gacha_ten'        // 十连保底稀有
  | 'gacha_mythic_drop'// 扭出 Lv3（神话前兆）
  | 'pet_born'         // 宠物出生
  | 'pet_evolve'       // 宠物进化（v0.3）
  | 'pet_feed'         // 喂食
  | 'pet_play'         // 和宠物玩
  | 'task_claim'       // 完成任务
  | 'task_rare'        // 完成高难度任务
  | 'task_main'        // v0.3：主线任务奖励
  | 'collection_full'  // 集齐一区
  | 'combo_break'      // 故意断连（取消重置）
  | 'tutorial_step'    // 教程奖励

export interface RewardEvent {
  kind: EventKind
  base: number
  label: string
  emoji: string
  /** 视觉强度 0-3（0 飘字，1 飘字+粒子，2 全屏震动+大彩纸，3 神级爆光） */
  intensity: 0 | 1 | 2 | 3
  /** 颜色主题（动效用） */
  color: string
}

const REWARDS: Record<EventKind, RewardEvent> = {
  merge_basic:        { kind: 'merge_basic',        base: 1,   label: '+1 币',     emoji: '🪙', intensity: 0, color: '#ffd76b' },
  merge_combo:        { kind: 'merge_combo',        base: 5,   label: '连击!',      emoji: '🔥', intensity: 1, color: '#ff8a5b' },
  merge_first:        { kind: 'merge_first',        base: 10,  label: '首合成!',    emoji: '🆕', intensity: 1, color: '#86efac' },
  merge_rare:         { kind: 'merge_rare',         base: 30,  label: '稀有合成!',  emoji: '✨', intensity: 1, color: '#93c5fd' },
  merge_epic:         { kind: 'merge_epic',         base: 80,  label: '史诗合成!',  emoji: '💎', intensity: 2, color: '#c084fc' },
  merge_mythic:       { kind: 'merge_mythic',       base: 200, label: '神话诞生!',  emoji: '🌟', intensity: 2, color: '#fbbf24' },
  merge_awaken:       { kind: 'merge_awaken',       base: 500, label: '觉醒!!!',    emoji: '⚡', intensity: 3, color: '#fb923c' },
  merge_awaken_t5:    { kind: 'merge_awaken_t5',    base: 2000, label: '五阶觉醒!', emoji: '💫', intensity: 3, color: '#a78bfa' },
  merge_awaken_t10:   { kind: 'merge_awaken_t10',   base: 10000, label: '十阶!', emoji: '🔮', intensity: 3, color: '#f0abfc' },
  merge_crit:         { kind: 'merge_crit',         base: 50,  label: '暴击! ×5',   emoji: '💥', intensity: 2, color: '#ef4444' },
  merge_lucky:        { kind: 'merge_lucky',        base: 20,  label: '幸运区!',    emoji: '🍀', intensity: 1, color: '#a3e635' },
  merge_season:       { kind: 'merge_season',       base: 30,  label: '季节加成!',  emoji: '🌸', intensity: 1, color: '#fbbf24' },
  gacha_single:       { kind: 'gacha_single',       base: 0,   label: '扭蛋 +1',    emoji: '🎰', intensity: 0, color: '#ff6b4a' },
  gacha_ten:          { kind: 'gacha_ten',          base: 0,   label: '十连开!',    emoji: '✨', intensity: 1, color: '#ffc940' },
  gacha_mythic_drop:  { kind: 'gacha_mythic_drop',  base: 50,  label: '出 Lv.3!',  emoji: '🌟', intensity: 1, color: '#fbbf24' },
  pet_born:           { kind: 'pet_born',           base: 100, label: '宠物降生!',  emoji: '🥚', intensity: 2, color: '#fde047' },
  pet_evolve:         { kind: 'pet_evolve',         base: 500, label: '宠物进化!',  emoji: '🌟', intensity: 2, color: '#fb923c' },
  pet_feed:           { kind: 'pet_feed',           base: 3,   label: '+3 喂食',    emoji: '🍖', intensity: 0, color: '#fda4af' },
  pet_play:           { kind: 'pet_play',           base: 2,   label: '+2 玩耍',    emoji: '💕', intensity: 0, color: '#f9a8d4' },
  task_claim:         { kind: 'task_claim',         base: 5,   label: '任务奖励',   emoji: '📜', intensity: 0, color: '#d4d4d4' },
  task_rare:          { kind: 'task_rare',          base: 20,  label: '稀有任务',   emoji: '🏆', intensity: 1, color: '#fbbf24' },
  task_main:          { kind: 'task_main',          base: 100, label: '主线!',     emoji: '🎯', intensity: 2, color: '#a78bfa' },
  collection_full:    { kind: 'collection_full',    base: 500, label: '集齐一区!', emoji: '🎉', intensity: 3, color: '#f0abfc' },
  combo_break:        { kind: 'combo_break',        base: 0,   label: '连击中断',   emoji: '💨', intensity: 0, color: '#737373' },
  tutorial_step:      { kind: 'tutorial_step',      base: 5,   label: '+5 教程',    emoji: '🎓', intensity: 0, color: '#a3e635' },
}

/** 查询事件配置 */
export const getReward = (kind: EventKind): RewardEvent => REWARDS[kind]

/**
 * 计算实际奖励金额（叠加系数）
 * - combo 倍率
 * - 等级倍数
 * - 宠物好感加成
 */
export interface RewardCalc {
  base: number
  multiplier: number
  reason: string[]
  final: number
}

export const calcReward = (
  kind: EventKind,
  multipliers: { combo?: number; level?: number; affection?: number } = {},
): RewardCalc => {
  const r = getReward(kind)
  const reasons: string[] = []
  let mul = 1
  if (multipliers.combo && multipliers.combo > 1) {
    mul *= multipliers.combo
    reasons.push(`连击×${multipliers.combo}`)
  }
  if (multipliers.level && multipliers.level > 1) {
    mul *= multipliers.level
    reasons.push(`等级×${multipliers.level}`)
  }
  if (multipliers.affection && multipliers.affection > 0) {
    const af = 1 + (multipliers.affection / 100) * 0.5  // 好感度 100% 时 +50%
    mul *= af
    reasons.push(`好感+${Math.round((af - 1) * 100)}%`)
  }
  return {
    base: r.base,
    multiplier: Math.round(mul * 100) / 100,
    reason: reasons,
    final: Math.round(r.base * mul),
  }
}

/** 合成事件的"等级 → 事件类型"映射 */
export const mergeEventFromLevel = (
  level: number,
  isFirstTime: boolean,
): { kind: EventKind; bonusLevelMul: number } => {
  let kind: EventKind
  if (level >= MAX_LEVEL_PLACEHOLDER) kind = 'merge_mythic'
  else if (level >= 8) kind = 'merge_epic'
  else if (level >= 5) kind = 'merge_rare'
  else if (isFirstTime) kind = 'merge_first'
  else kind = 'merge_basic'
  return { kind, bonusLevelMul: 1 + (level - 1) * 0.1 }
}

const MAX_LEVEL_PLACEHOLDER = 10
