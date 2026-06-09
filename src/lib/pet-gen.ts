/**
 * 宠物生成器 v0.3：进化系统
 * - 4 个形态阶段：蛋 → 幼崽（Lv.2）→ 成体（Lv.5）→ 觉醒（Lv.8+）
 * - 每次进化触发屏幕爆发 + 货币奖励
 * - 完全随机 + 受玩家合成历史影响
 */
import { rng, pick, rngInt, nextId } from './rng'

export type PetSpecies =
  | 'rabbit' | 'cat' | 'fox' | 'dragon' | 'deer'
  | 'bear' | 'crane' | 'fish' | 'butterfly' | 'owl'
  | 'unicorn' | 'phoenix'

export type PetForm = 'egg' | 'baby' | 'adult' | 'awakened'

export type PetSize = 'mini' | 'normal' | 'stout' | 'giant' | 'mythic'

export type PetPersonality = 'clingy' | 'independent' | 'curious' | 'glutton' | 'proud'

export interface Pet {
  id: string
  species: PetSpecies
  speciesEmoji: string
  form: PetForm
  /** 进化阶段序号（0-3） */
  formStage: number
  size: PetSize
  sizeScale: number  // 0.6 ~ 1.4
  personality: PetPersonality
  hue: number        // 0-360
  saturation: number // 40-90
  lightness: number  // 45-70
  name: string
  level: number      // 1-10+
  affection: number  // 0-100
  /** 总互动次数（影响觉醒） */
  totalInteractions: number
  lastFedAt: number
  lastPetAt: number
  hatchedAt: number
  bornFrom: string   // 触发合成的胶囊 ID（可选）
  /** 累计触发觉醒次数（达到 3 后永久发光） */
  awakenCount: number
}

const SPECIES_EMOJI: Record<PetSpecies, string> = {
  rabbit: '🐰', cat: '🐱', fox: '🦊', dragon: '🐲',
  deer: '🦌', bear: '🐻', crane: '🕊', fish: '🐟',
  butterfly: '🦋', owl: '🦉', unicorn: '🦄', phoenix: '🔥',
}

/** 各阶段外观：蛋=🥚；幼崽=物种本体（小）；成体=物种本体（大）；觉醒=物种本体+光环 */
export const FORM_EMOJI: Record<PetForm, (species: PetSpecies) => string> = {
  egg: () => '🥚',
  baby: (s) => SPECIES_EMOJI[s],
  adult: (s) => SPECIES_EMOJI[s],
  awakened: (s) => `${SPECIES_EMOJI[s]}\u200d✨`,  // ZWJ + 闪光
}

const FORM_NAME: Record<PetForm, string> = {
  egg: '孵化中',
  baby: '幼崽',
  adult: '成体',
  awakened: '觉醒',
}

/** 等级 → 形态映射（升级会触发进化奖励） */
export const FORM_THRESHOLDS: Array<{ level: number; form: PetForm; reward: number; intensity: 0 | 1 | 2 | 3 }> = [
  { level: 1,  form: 'egg',      reward: 0,    intensity: 0 },
  { level: 2,  form: 'baby',     reward: 50,   intensity: 1 },
  { level: 5,  form: 'adult',    reward: 200,  intensity: 2 },
  { level: 8,  form: 'awakened', reward: 1000, intensity: 3 },
  { level: 10, form: 'awakened', reward: 5000, intensity: 3 },
]

const SIZE_SCALE: Record<PetSize, number> = {
  mini: 0.6, normal: 0.85, stout: 1.0, giant: 1.2, mythic: 1.4,
}

const SIZE_WEIGHTS: Array<{ v: PetSize; w: number }> = [
  { v: 'mini', w: 30 },
  { v: 'normal', w: 35 },
  { v: 'stout', w: 20 },
  { v: 'giant', w: 12 },
  { v: 'mythic', w: 3 },
]

const NAME_FIRST = [
  '霁', '岚', '青', '霭', '云', '烟', '霈', '星', '霈', '墨',
  '雪', '霜', '月', '露', '虹', '霓', '风', '霖', '霰', '溪',
  '屿', '岚', '崎', '峤', '峣', '嵘', '澈', '澹', '漪', '澜',
  '珩', '珏', '琅', '琬', '琰', '璇', '璞', '璟', '瑟', '瑜',
  '笙', '笛', '箫', '筝', '鸾', '鹤', '鹍', '鸽', '莺', '鸾',
]

const NAME_LAST = [
  '川', '行', '舟', '远', '归', '辞', '歌', '吟', '叹', '思',
  '白', '苍', '玄', '素', '缃', '绛', '霁', '岚', '崖', '汀',
  '初', '晚', '清', '微', '轻', '泠', '之', '予', '言', '安',
]

const weightedPick = <T extends { w: number }>(items: T[]): T => {
  const total = items.reduce((s, it) => s + it.w, 0)
  let r = rng() * total
  for (const it of items) {
    r -= it.w
    if (r <= 0) return it
  }
  return items[items.length - 1]!
}

export interface PetGenOptions {
  /** 玩家合成历史中的主色调（0-360），影响宠物色相 */
  dominantHue?: number
  /** 触发孵化时的等级（影响初始大小） */
  triggerLevel?: number
}

const getFormStage = (form: PetForm): number => {
  switch (form) {
    case 'egg': return 0
    case 'baby': return 1
    case 'adult': return 2
    case 'awakened': return 3
  }
}

/** 根据 level 计算当前形态 */
export const computeForm = (level: number): PetForm => {
  if (level >= 8) return 'awakened'
  if (level >= 5) return 'adult'
  if (level >= 2) return 'baby'
  return 'egg'
}

export const getFormLabel = (form: PetForm): string => FORM_NAME[form]

/** 生成一只随机宠物（出生就是蛋形态） */
export const generatePet = (opts: PetGenOptions = {}): Pet => {
  const speciesKeys = Object.keys(SPECIES_EMOJI) as PetSpecies[]
  const species = pick(speciesKeys)
  const size = weightedPick(SIZE_WEIGHTS).v

  // 色相：50% 概率偏向玩家主色
  let hue = rngInt(0, 359)
  if (opts.dominantHue !== undefined && rng() < 0.5) {
    hue = (opts.dominantHue + rngInt(-30, 30) + 360) % 360
  }
  const saturation = rngInt(45, 85)
  const lightness = rngInt(50, 70)

  const personality = pick<PetPersonality>(['clingy', 'independent', 'curious', 'glutton', 'proud'])

  const name = `${pick(NAME_FIRST)}${pick(NAME_LAST)}`

  const now = Date.now()
  return {
    id: nextId('pet'),
    species,
    speciesEmoji: SPECIES_EMOJI[species],
    form: 'egg',
    formStage: 0,
    size,
    sizeScale: SIZE_SCALE[size],
    personality,
    hue,
    saturation,
    lightness,
    name,
    level: 1,
    affection: 0,
    totalInteractions: 0,
    lastFedAt: now - 30_000,  // 初始即可喂食
    lastPetAt: now - 5_000,   // 初始即可抚摸
    hatchedAt: now,
    bornFrom: '',
    awakenCount: 0,
  }
}

/** 喂食升级（30s 冷却，30% 升级） */
export const feedPet = (pet: Pet): { pet: Pet; evolved: boolean; full: boolean; formChanged: boolean; newForm?: PetForm; reward?: number; intensity?: 0 | 1 | 2 | 3 } => {
  const now = Date.now()
  // 30 秒冷却
  if (now - pet.lastFedAt < 30_000) {
    return { pet, evolved: false, full: false, formChanged: false }
  }
  const newAffection = Math.min(100, pet.affection + 8)
  const newTotal = pet.totalInteractions + 1
  // 30% 概率升级（限 10）
  const evolved = pet.level < 10 && rng() < 0.3
  const newLevel = evolved ? pet.level + 1 : pet.level
  const oldForm = pet.form
  const newForm = computeForm(newLevel)
  const formChanged = oldForm !== newForm
  // 找阈值奖励
  let reward = 0
  let intensity: 0 | 1 | 2 | 3 = 0
  if (formChanged) {
    const t = FORM_THRESHOLDS.find(t => t.form === newForm)
    if (t) { reward = t.reward; intensity = t.intensity }
  }
  return {
    pet: {
      ...pet,
      affection: newAffection,
      level: newLevel,
      form: newForm,
      formStage: getFormStage(newForm),
      totalInteractions: newTotal,
      awakenCount: newForm === 'awakened' ? pet.awakenCount + 1 : pet.awakenCount,
      lastFedAt: now,
    },
    evolved,
    full: newAffection >= 100,
    formChanged,
    newForm: formChanged ? newForm : undefined,
    reward: formChanged ? reward : undefined,
    intensity: formChanged ? intensity : undefined,
  }
}

/** 抚摸加好感 + 累计互动（5s 冷却防刷） */
export const petPet = (pet: Pet): { pet: Pet; ready: boolean } => {
  const now = Date.now()
  if (now - pet.lastPetAt < 5_000) {
    return { pet, ready: false }
  }
  return {
    pet: {
      ...pet,
      affection: Math.min(100, pet.affection + 3),
      totalInteractions: pet.totalInteractions + 1,
      lastPetAt: now,
    },
    ready: true,
  }
}

/** 性格 → 跟随行为参数 */
export interface FollowBehavior {
  /** 跟随延迟（秒） */
  lag: number
  /** 静止多久触发打哈欠 */
  idleYawn: number
  /** 静止多久开始游走 */
  idleWander: number
  /** 游走速度倍率 */
  wanderSpeed: number
  /** 跳起频率（每秒） */
  jumpFreq: number
}

export const personalityBehavior = (p: PetPersonality): FollowBehavior => {
  switch (p) {
    case 'clingy':
      return { lag: 0.15, idleYawn: 3, idleWander: 10, wanderSpeed: 1.2, jumpFreq: 0.4 }
    case 'independent':
      return { lag: 0.6, idleYawn: 8, idleWander: 4, wanderSpeed: 0.4, jumpFreq: 0.1 }
    case 'curious':
      return { lag: 0.3, idleYawn: 5, idleWander: 8, wanderSpeed: 1.0, jumpFreq: 0.3 }
    case 'glutton':
      return { lag: 0.25, idleYawn: 6, idleWander: 12, wanderSpeed: 0.7, jumpFreq: 0.2 }
    case 'proud':
      return { lag: 0.45, idleYawn: 7, idleWander: 15, wanderSpeed: 0.5, jumpFreq: 0.15 }
  }
}
