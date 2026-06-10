/**
 * v11.0 主动式在线百科（用户点击"🌐 试试在线"才调用）
 * - 默认不调任何外网 API（v8.0 国内被墙 → 用户体感"做了不靠谱的事还告诉我"）
 * - 失败 / 超时一律静默，不弹任何 toast
 * - 主动调用仍然走 AbortController 4s 超时，但失败不告知用户
 */
import type { ZoneId } from '@/data/emoji-trees'

const WIKI_ZH = 'https://zh.wikipedia.org/api/rest_v1/page/summary/'
const MEALDB = 'https://www.themealdb.com/api/json/v1/1/search.php'

const API_TIMEOUT_MS = 4000

export interface OnlineStory {
  title: string
  extract: string
  thumbnail?: string
  url?: string
  source: 'wiki' | 'meal'
}

const FOOD_ZONES = new Set<ZoneId>(['food', 'ocean'])

async function fetchWithTimeout(url: string, opts: RequestInit = {}, timeoutMs = API_TIMEOUT_MS) {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), timeoutMs)
  try {
    return await fetch(url, { ...opts, signal: ctrl.signal })
  } finally {
    clearTimeout(timer)
  }
}

/** v11.0 主动调用：用户点 "🌐 试试在线" 才走这条路。失败时返回 null，不抛错不弹窗 */
export async function fetchOnline(name: string, zone: ZoneId): Promise<OnlineStory | null> {
  const cleanName = name.replace(/[\u{1F3FB}-\u{1F3FF}]/gu, '').trim()
  if (!cleanName) return null

  // 1) 食物类优先 TheMealDB
  if (FOOD_ZONES.has(zone)) {
    const meal = await fetchMeal(cleanName).catch(() => null)
    if (meal) return meal
  }
  // 2) Wikipedia 中文摘要
  const wiki = await fetchWiki(cleanName).catch(() => null)
  if (wiki) return wiki

  return null
}

async function fetchWiki(title: string): Promise<OnlineStory | null> {
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

async function fetchMeal(name: string): Promise<OnlineStory | null> {
  const url = `${MEALDB}?s=${encodeURIComponent(name)}`
  const res = await fetchWithTimeout(url)
  if (!res.ok) return null
  const data = await res.json()
  const m = data?.meals?.[0]
  if (!m?.strMeal) return null
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
