/**
 * 周末双倍活动 v0.6
 * - 周六周日货币 ×2（合成的币 + 扭蛋获得）
 * - 主页显示"🎉 周末双倍"标识
 */
export const isWeekendDouble = (d: Date = new Date()): boolean => {
  const day = d.getDay()
  return day === 0 || day === 6  // 周日 / 周六
}

/** 周末加成（合成的币双倍） */
export const applyWeekendBonus = (coins: number, d: Date = new Date()): number => {
  return isWeekendDouble(d) ? coins * 2 : coins
}
