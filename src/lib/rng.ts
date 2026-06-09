/**
 * 统一随机数工具（可注入，便于测试）
 */
let seeded: (() => number) | null = null

export const setRng = (fn: (() => number) | null) => {
  seeded = fn
}

export const rng = (): number => (seeded ? seeded() : Math.random())

export const rngInt = (min: number, max: number): number =>
  Math.floor(rng() * (max - min + 1)) + min

export const pick = <T>(arr: T[]): T => arr[Math.floor(rng() * arr.length)]!

/** 加权随机 */
export const weightedPick = <T extends { weight: number }>(items: T[]): T => {
  const total = items.reduce((s, it) => s + it.weight, 0)
  let r = rng() * total
  for (const it of items) {
    r -= it.weight
    if (r <= 0) return it
  }
  return items[items.length - 1]!
}

/** 范围裁剪 */
export const clamp = (n: number, min: number, max: number): number =>
  Math.max(min, Math.min(max, n))

/** 稳定 ID */
let _id = 0
export const nextId = (prefix = 'id'): string =>
  `${prefix}_${Date.now().toString(36)}_${(_id++).toString(36)}`
