/**
 * 分享卡片生成器 v0.6
 * - Canvas API 生成 9:16 卡片
 * - 包含：emoji + 等级 + 季节 + 宠物 + 水印
 * - 提供下载链接
 */
import type { ZoneId } from '@/data/emoji-trees'
import { ZONES, getLevelLabel } from '@/data/emoji-trees'
import { getSeason, seasonEmoji, seasonLabel } from './season'

export interface ShareCardData {
  emoji: string
  level: number
  zone: ZoneId
  zoneName: string
  /** 玩家名（默认"我"） */
  playerName?: string
  /** 宠物 emoji（可选） */
  petEmoji?: string
  /** 总合成数 */
  mergeCount?: number
  /** 最高连击 */
  bestCombo?: number
}

/**
 * 渲染分享卡片到 canvas，返回 PNG dataURL
 * 尺寸：540 x 960（9:16）
 */
export const renderShareCard = (data: ShareCardData): string => {
  const w = 540
  const h = 960
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')!

  const zone = ZONES[data.zone]
  const color = zone.color
  const season = getSeason()
  const isAwaken = data.level > 11

  // 背景渐变
  const bg = ctx.createLinearGradient(0, 0, 0, h)
  bg.addColorStop(0, '#0e0c0a')
  bg.addColorStop(0.5, color + '40')
  bg.addColorStop(1, '#0e0c0a')
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, w, h)

  // 装饰光晕
  for (let i = 0; i < 3; i++) {
    ctx.beginPath()
    ctx.arc(w / 2, h * 0.4, 200 + i * 80, 0, Math.PI * 2)
    ctx.fillStyle = color + (15 - i * 5).toString(16).padStart(2, '0')
    ctx.fill()
  }

  // 顶部水印
  ctx.fillStyle = 'rgba(255,255,255,0.5)'
  ctx.font = 'bold 22px system-ui, sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText('🌟 扭蛋 2048 · 合成生态', w / 2, 50)

  // 季节 + 主题
  ctx.fillStyle = '#ffffff'
  ctx.font = 'bold 20px system-ui, sans-serif'
  ctx.fillText(`${seasonEmoji(season)} ${seasonLabel(season)}季 · ${data.zoneName}`, w / 2, 90)

  // 主 emoji（大）
  ctx.font = '280px system-ui, sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText(data.emoji, w / 2, 380)

  // 等级标签
  ctx.fillStyle = isAwaken ? '#fbbf24' : '#ffffff'
  ctx.font = `bold ${isAwaken ? 48 : 56}px system-ui, sans-serif`
  ctx.fillText(getLevelLabel(data.level), w / 2, 460)

  // 觉醒徽章
  if (isAwaken) {
    ctx.fillStyle = 'rgba(251,191,36,0.2)'
    ctx.fillRect(w / 2 - 80, 490, 160, 30)
    ctx.strokeStyle = '#fbbf24'
    ctx.strokeRect(w / 2 - 80, 490, 160, 30)
    ctx.fillStyle = '#fbbf24'
    ctx.font = 'bold 16px system-ui, sans-serif'
    ctx.fillText('⚡ 觉醒者 ⚡', w / 2, 511)
  }

  // 副信息：合成数 + 连击
  ctx.fillStyle = 'rgba(255,255,255,0.6)'
  ctx.font = '18px system-ui, sans-serif'
  if (data.mergeCount !== undefined) {
    ctx.fillText(`🧬 合成 ${data.mergeCount} 次`, w / 2, 600)
  }
  if (data.bestCombo !== undefined) {
    ctx.fillText(`🔥 最高连击 ×${data.bestCombo}`, w / 2, 630)
  }

  // 宠物
  if (data.petEmoji) {
    ctx.font = '120px system-ui, sans-serif'
    ctx.fillText(data.petEmoji, w / 2, 780)
  }

  // 玩家名 + 二维码占位
  ctx.fillStyle = 'rgba(255,255,255,0.7)'
  ctx.font = 'bold 20px system-ui, sans-serif'
  const playerName = data.playerName || '我'
  ctx.fillText(`${playerName} 的合成`, w / 2, 870)

  // 底部链接
  ctx.fillStyle = 'rgba(255,255,255,0.4)'
  ctx.font = '14px system-ui, sans-serif'
  ctx.fillText('👉 if3077-beep.github.io/emoji-2048-gashapon', w / 2, 930)

  return canvas.toDataURL('image/png')
}

/** 触发下载 PNG */
export const downloadShareCard = (dataUrl: string, filename = 'emoji-2048-share.png') => {
  const a = document.createElement('a')
  a.href = dataUrl
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
}
