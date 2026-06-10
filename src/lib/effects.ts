/**
 * v6.0 全局动效配色 — 极光紫青
 * - 把分散的 `rgba(251,191,36,...)` 集中管理
 * - 全部动效光晕用紫青渐变，避免黄色"土"
 * - 支持 per-zone 主题色（4×4 grid 飞粒子时按 zone 染色）
 */
import { ZONES, type ZoneId } from '@/data/emoji-trees'

/** 极光色板：紫 / 青 / 粉（避免黄色"太土"） */
export const AURORA = {
  purple: '#a78bfa',  // violet-400
  purpleSoft: '#c4b5fd', // violet-300
  cyan: '#67e8f9',    // cyan-300
  cyanSoft: '#a5f3fc',  // cyan-200
  pink: '#f0abfc',    // fuchsia-300
  pinkSoft: '#f5d0fe',  // fuchsia-200
  white: '#ffffff',
} as const

/** 通用 trail 渐变：紫 → 青 */
export const TRAIL_GRADIENT = `linear-gradient(90deg, ${AURORA.purple}, ${AURORA.cyan})`

/** 通用双层 box-shadow 字符串：紫青光晕 */
export const GLOW_PURPLE_CYAN = `0 0 18px ${AURORA.purple}cc, 0 0 36px ${AURORA.cyan}88`
export const GLOW_CYAN_PINK = `0 0 18px ${AURORA.cyan}cc, 0 0 36px ${AURORA.pink}88`

/** 流光带 CSS（横向竖向用同一份文字 + 方向控制） */
export const BEAM_HStyle = (lengthPx: number) => ({
  background: `linear-gradient(180deg, transparent 0%, ${AURORA.purple}cc 20%, ${AURORA.cyan} 50%, ${AURORA.purple}cc 80%, transparent 100%)`,
  boxShadow: `0 0 18px ${AURORA.cyan}cc, 0 0 36px ${AURORA.purple}88`,
})
export const BEAM_VStyle = (lengthPx: number) => ({
  background: `linear-gradient(90deg, transparent 0%, ${AURORA.purple}cc 20%, ${AURORA.cyan} 50%, ${AURORA.purple}cc 80%, transparent 100%)`,
  boxShadow: `0 0 18px ${AURORA.cyan}cc, 0 0 36px ${AURORA.purple}88`,
})

/** 按 zone 取主题色（合成时染色用） */
export const zoneColor = (z: ZoneId): string => ZONES[z]?.color ?? AURORA.purple

/** 按 zone 取发光阴影（rgb 元组） */
export const zoneGlow = (z: ZoneId): string => {
  const c = ZONES[z]
  if (!c) return GLOW_PURPLE_CYAN
  return `0 0 18px ${c.color}cc, 0 0 36px ${c.color}55`
}

/** 数字飘字颜色（按 isCrit / isLucky） */
export const flyTextColor = (isCrit: boolean, isLucky: boolean) => {
  if (isCrit) return '#fca5a5'  // red-300
  if (isLucky) return '#86efac'  // green-300
  return '#c4b5fd'                // violet-300（替代 fde68a 黄）
}

/** 数字飘字 + emoji 粒子的 drop-shadow 颜色 */
export const dropShadow = (isCrit: boolean, isLucky: boolean) => {
  if (isCrit) return '#ef4444'
  if (isLucky) return '#22c55e'
  return AURORA.cyan
}

/** 起点光球（v10.0 简化：白→青 弱光晕） */
export const startBallInner = `radial-gradient(circle, ${AURORA.white}ee, ${AURORA.cyan}cc 40%, transparent 100%)`
export const startBallShadow = `0 0 6px ${AURORA.cyan}aa`

/** 终点爆裂（青粉） */
export const endBurstInner = `radial-gradient(circle, ${AURORA.white}, ${AURORA.cyan} 40%, transparent 70%)`
export const endBurstShadow = `0 0 22px ${AURORA.cyan}cc`

/** 移动 cell 闪光（白 + 紫） */
export const cellFlash = (zone?: ZoneId) => {
  const c = zone ? zoneColor(zone) : AURORA.purple
  return `inset 0 0 0 2px ${AURORA.white}ee, 0 0 16px ${c}cc`
}

/** 合并位置浮起阴影（v10.0 收紧到 6px） */
export const mergeFloatShadow = (zone?: ZoneId) => {
  const c = zone ? zoneColor(zone) : AURORA.cyan
  return `0 -4px 0 0 ${c}55, 0 0 6px ${c}cc`
}

/**
 * v10.0 涟漪环样式（细环，紫青）
 * - 1px 细环，紫青色
 * - 透明中心，向外扩散时 ring 加粗
 */
export const rippleRing = (color: string = AURORA.cyan, thickness: number = 1) => ({
  border: `${thickness}px solid ${color}`,
  background: 'transparent',
  boxShadow: `0 0 4px ${color}88, inset 0 0 2px ${color}33`,
  borderRadius: '50%',
})
