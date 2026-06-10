/**
 * v11.0 zone 关联网络（跨区推荐用）
 * - 每个 zone 关联 2-3 个 zone + 一句话理由
 * - 用于故事页"→ 推荐下一个 zone" 和 "🌐 关联 zone" 区
 */
import type { ZoneId } from './emoji-trees'

export interface ZoneLink {
  to: ZoneId
  reason: string
}

export const ZONE_NETWORK: Record<ZoneId, ZoneLink[]> = {
  creature: [
    { to: 'plant', reason: '🌱 生命起源于海洋 → 陆生 → 植物先行' },
    { to: 'mythology', reason: '🐉 神龙原型很可能源于古人对恐龙的想象' },
  ],
  plant: [
    { to: 'creature', reason: '🌿 植物与菌根的共生，是生态圈的"地基"' },
    { to: 'element', reason: '🍃 风是植物种子最远的传播者' },
  ],
  element: [
    { to: 'cosmic', reason: '☄️ 元素周期表里的重元素几乎全部来自恒星' },
    { to: 'ocean', reason: '💧 水是地球"最常见的元素集合"' },
  ],
  culture: [
    { to: 'music', reason: '🎭 古希腊戏剧本身就是"配乐演出"' },
    { to: 'architecture', reason: '🏛️ 建筑是凝固的文化' },
  ],
  food: [
    { to: 'ocean', reason: '🐟 海鲜是"食物圈"最古老的成员之一' },
    { to: 'culture', reason: '🍜 食物是文化最具体的载体' },
  ],
  cosmic: [
    { to: 'element', reason: '🌌 元素周期表是宇宙演化的"年表"' },
    { to: 'dream', reason: '💫 "星海"和"梦"都暗示着无穷大' },
  ],
  music: [
    { to: 'culture', reason: '🎼 音乐是最早被记录的艺术之一' },
    { to: 'dream', reason: '🎶 "白日梦"常配 BGM——音乐和梦境的边界很薄' },
  ],
  architecture: [
    { to: 'culture', reason: '🏯 建筑是文化外化的最高形式' },
    { to: 'retro', reason: '🕹️ 像素游戏里 90% 的"城堡"取材自真实建筑' },
  ],
  mythology: [
    { to: 'dream', reason: '🌙 神话是"集体的梦"——荣格如是说' },
    { to: 'creature', reason: '🐉 神兽往往是动物的"神格化"' },
  ],
  dream: [
    { to: 'mythology', reason: '💭 神话和梦境共享"原型"（荣格）' },
    { to: 'cosmic', reason: '🌌 "梦中梦"是爱因斯坦相对论的文学前身' },
  ],
  retro: [
    { to: 'architecture', reason: '🕹️ 像素城堡的灵感来源是真实的中世纪塔楼' },
    { to: 'music', reason: '🎮 8-bit 音乐只有 4 个音轨，但能讲完整故事' },
  ],
  ocean: [
    { to: 'creature', reason: '🐙 生命起源于海洋' },
    { to: 'food', reason: '🐟 海鲜是"食物圈"最古老的成员之一' },
  ],
}

/** 取 1 个推荐 zone（按 zone network 推） */
export function pickRelatedZone(zone: ZoneId): ZoneLink | null {
  const links = ZONE_NETWORK[zone]
  if (!links || links.length === 0) return null
  return links[0]
}
