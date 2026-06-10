/**
 * v6.1 图鉴故事 + 菜谱 异步获取
 * v8.0 加 4s 超时 + AbortController，国内环境维基被墙时快速回退
 * - Wikipedia 中文摘要（无 key，免费）
 * - TheMealDB 菜谱（无 key，免费，限食物类）
 * - 内置 fallback：API 失败时回退到 emoji-trees 风味描述（lore + zone.flavor）
 */
import { ZONES, type ZoneId } from '@/data/emoji-trees'

const WIKI_ZH = 'https://zh.wikipedia.org/api/rest_v1/page/summary/'
const MEALDB = 'https://www.themealdb.com/api/json/v1/1/search.php'

/** v8.0 国内环境：4s 超时 */
const API_TIMEOUT_MS = 4000

export interface StoryResult {
  title: string
  extract: string
  /** Wikipedia 缩略图 URL（无则 null） */
  thumbnail?: string
  /** 来源 URL（用户可点开） */
  url?: string
  /** 加载来源 wiki/meal/local */
  source: 'wiki' | 'meal' | 'local'
  /** v8.0 是否因超时/失败而离线回退 */
  offline?: boolean
}

/** zone 类型 → 候选 wiki 词条关键词（中文） */
const ZONE_WIKI_KEYWORDS: Record<ZoneId, string[]> = {
  creature: ['动物', '生物'],
  plant: ['植物', '草本植物'],
  element: ['元素', '自然元素'],
  culture: ['文化', '艺术品'],
  food: ['食物', '美食'],
  cosmic: ['宇宙', '天体'],
  music: ['音乐', '乐器'],
  architecture: ['建筑', '桥梁'],
  mythology: ['神话', '传说'],
  dream: ['梦', '幻想'],
  retro: ['复古', '电子游戏'],
  ocean: ['海洋', '海洋生物'],
}

/** 食物类 zone（用 TheMealDB） */
const FOOD_ZONES = new Set<ZoneId>(['food', 'ocean'])

/** emoji → 简单映射（脱掉变体符号） */
const normalize = (s: string) => s.replace(/[\u{1F3FB}-\u{1F3FF}]/gu, '').trim()

/** v8.0 带超时的 fetch */
async function fetchWithTimeout(url: string, opts: RequestInit = {}, timeoutMs = API_TIMEOUT_MS) {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), timeoutMs)
  try {
    const res = await fetch(url, { ...opts, signal: ctrl.signal })
    return res
  } finally {
    clearTimeout(timer)
  }
}

/**
 * v8.0 找 emoji 节点拿 lore（本地故事库）
 * 顺序：tree[level-1].lore → zone.description
 */
function getLoreSnippet(emoji: string, zone: ZoneId, level: number, fallbackName: string): string {
  const z = ZONES[zone]
  if (!z) return fallbackName
  const node = level >= 1 && level <= 11 ? z.tree[level - 1] : null
  if (node?.lore) return `${node.lore}（${z.flavor}）`
  return `${z.description} · 成员：${fallbackName}`
}

/** v6.1 取 emoji 的故事（异步），v8.0 加超时 + local 兜底 */
export async function fetchStory(emoji: string, zone: ZoneId, fallbackName: string, level: number = 1): Promise<StoryResult> {
  const name = normalize(fallbackName)
  const loreSnippet = getLoreSnippet(emoji, zone, level, fallbackName)

  // 1) 先尝试 TheMealDB（食物）
  if (FOOD_ZONES.has(zone) && name) {
    const meal = await fetchMeal(name).catch(() => null)
    if (meal) return meal
  }
  // 2) Wikipedia
  if (name) {
    const wiki = await fetchWiki(name).catch(() => null)
    if (wiki) return wiki
  }
  // 3) Zone 默认关键词
  const keywords = ZONE_WIKI_KEYWORDS[zone] ?? []
  for (const kw of keywords) {
    const w = await fetchWiki(kw).catch(() => null)
    if (w) return w
  }
  // 4) v8.0 离线回退：返回 lore 字段作为 snippet
  return { title: fallbackName, extract: loreSnippet, source: 'local', offline: true }
}

/** 找 level（外部传入或推算） */
function level(_emoji: string, _zone: ZoneId, fallbackName: string): number {
  // 外部不传 level，简单用 1 兜底
  return 1
}

/** Wikipedia 中文摘要（v8.0 4s 超时） */
async function fetchWiki(title: string): Promise<StoryResult | null> {
  const url = `${WIKI_ZH}${encodeURIComponent(title)}`
  const res = await fetchWithTimeout(url, { headers: { Accept: 'application/json' } })
  if (!res.ok) return null
  const data = await res.json()
  if (!data?.extract) return null
  return {
    title: data.title ?? title,
    extract: data.extract,
    thumbnail: data.thumbnail?.source,
    url: data.content_urls?.desktop?.page,
    source: 'wiki',
  }
}

/** TheMealDB 搜索（v8.0 4s 超时） */
async function fetchMeal(name: string): Promise<StoryResult | null> {
  const url = `${MEALDB}?s=${encodeURIComponent(name)}`
  const res = await fetchWithTimeout(url)
  if (!res.ok) return null
  const data = await res.json()
  const m = data?.meals?.[0]
  if (!m?.strMeal) return null
  // 取前 2 步指令做摘要（避免暴露全部）
  const steps: string[] = []
  for (let i = 1; i <= 2; i++) {
    const s = (m as any)[`strMeasure${i}`]?.trim()
    const t = (m as any)[`strIngredient${i}`]?.trim()
    if (s && t) steps.push(`${s} ${t}`)
  }
  return {
    title: m.strMeal,
    extract: `🍽️ ${m.strArea ?? '世界'} · ${m.strCategory ?? '美食'}。主要食材：${steps.join('、') || '未提供'}。${m.strInstructions ? m.strInstructions.slice(0, 80) + '…' : ''}`,
    thumbnail: m.strMealThumb,
    url: m.strSource || `https://www.themealdb.com/meal/${m.idMeal}`,
    source: 'meal',
  }
}
