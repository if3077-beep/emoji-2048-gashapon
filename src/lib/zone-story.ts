/**
 * v11.0 本地故事组装器（默认零外网）
 * - 不调任何 API，瞬时返回
 * - 整合 zone description + flavor + node lore + 冷知识 + 合成链 + 关联 zone
 */
import { ZONES, type ZoneId } from '@/data/emoji-trees'
import { getTriviaFor, getFestivalLore } from '@/data/zone-trivia'
import { ZONE_NETWORK, pickRelatedZone, type ZoneLink } from '@/data/zone-network'

export interface LocalStory {
  /** 标题 = emoji + name */
  title: string
  /** 4 段结构化内容 */
  sections: {
    background: string   // 背景（zone.description 改写）
    trivia: string       // 冷知识（zone-trivia）
    chain: {             // 合成链（当前 → 下一级）
      nextEmoji: string
      nextName: string
      hint: string
    } | null
    related: ZoneLink[]  // 关联 zone（zone-network 推 2 个）
    festival?: string    // 节日特辑（v11.2）
  }
  /** 来源徽章（默认就是本地） */
  source: 'local'
}

const CHAIN_HINTS = [
  '把这两颗凑一起，就能合成下一级',
  '再合成一次，达成下一形态',
  '继续合并，迈向更高层级',
  '差一颗就能升一级了',
  '羁绊已显，再合一次解锁',
]

function hintFor(zone: ZoneId, level: number): string {
  const hints = ZONE_NETWORK[zone]?.map(l => l.reason) ?? CHAIN_HINTS
  const idx = level % hints.length
  return CHAIN_HINTS[idx] ?? CHAIN_HINTS[0]
}

export function getLocalStory(
  emoji: string,
  zone: ZoneId,
  level: number,
  fallbackName: string,
): LocalStory {
  const z = ZONES[zone]
  const node = level >= 1 && level <= 11 ? z?.tree?.[level - 1] : null
  const name = node?.name ?? fallbackName
  const nextNode = level >= 1 && level < 11 ? z?.tree?.[level] : null

  // 关联 zone：zone-network 推 2 个
  const related = (ZONE_NETWORK[zone] ?? []).slice(0, 2)

  // 节日特辑
  const festival = getFestivalLore() ?? undefined

  return {
    title: `${emoji} ${name}`,
    sections: {
      background: node?.lore
        ? `${node.lore}（${z?.flavor ?? ''}）`
        : `${z?.description ?? ''} · ${z?.flavor ?? ''}`,
      trivia: getTriviaFor(zone, level),
      chain: nextNode
        ? { nextEmoji: nextNode.emoji, nextName: nextNode.name, hint: hintFor(zone, level) }
        : null,
      related,
      festival,
    },
    source: 'local',
  }
}

/** 推荐下一个 zone（跨区跳转用） */
export function getRecommendedZone(zone: ZoneId): ZoneLink | null {
  return pickRelatedZone(zone)
}

/** 随机一个 zone + level（v11.2 随机故事用） */
export function getRandomStoryTarget(): { zone: ZoneId; level: number } {
  const zoneIds: ZoneId[] = Object.keys(ZONES) as ZoneId[]
  const z = zoneIds[Math.floor(Math.random() * zoneIds.length)]
  const lv = 1 + Math.floor(Math.random() * 11)
  return { zone: z, level: lv }
}
