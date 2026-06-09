/**
 * 国内公益 API 客户端
 * - 统一超时 + 降级文案 + LRU 缓存（5min）
 * - 失败不影响主流程
 */
const CACHE_TTL = 5 * 60 * 1000

interface CacheEntry<T> {
  value: T
  expires: number
}
const cache = new Map<string, CacheEntry<unknown>>()

const getCached = <T>(key: string): T | null => {
  const e = cache.get(key)
  if (!e) return null
  if (Date.now() > e.expires) {
    cache.delete(key)
    return null
  }
  return e.value as T
}

const setCached = <T>(key: string, value: T) => {
  cache.set(key, { value, expires: Date.now() + CACHE_TTL })
}

const fetchWithTimeout = async <T>(url: string, timeout = 3000): Promise<T> => {
  const c = new AbortController()
  const tm = setTimeout(() => c.abort(), timeout)
  try {
    const r = await fetch(url, { signal: c.signal })
    if (!r.ok) throw new Error(`HTTP ${r.status}`)
    return (await r.json()) as T
  } finally {
    clearTimeout(tm)
  }
}

export type ApiId =
  | 'love' // 情话
  | 'poison' // 毒鸡汤
  | 'chp' // 彩虹屁
  | 'shici' // 诗词
  | 'qinghua' // 土味情话
  | 'du' // 经典语录
  | 'riddle' // 谜语
  | 'hitokoto' // 一言
  | 'quote' // 励志
  | 'tang' // 唐诗
  | 'song' // 宋词

interface ApiConfig {
  id: ApiId
  label: string
  url: string
  extract: (data: any) => string
  fallback: string[]
}

export const APIS: ApiConfig[] = [
  {
    id: 'love',
    label: '情话',
    url: 'https://api.vvhan.com/api/text/love',
    extract: d => d?.data?.content ?? d?.content ?? '',
    fallback: ['你笑起来真像好天气。', '我愿陪你走到世界尽头。', '你是年少的欢喜。'],
  },
  {
    id: 'poison',
    label: '毒鸡汤',
    url: 'https://api.vvhan.com/api/text/poison',
    extract: d => d?.data?.content ?? d?.content ?? '',
    fallback: ['不是生活不累，是你不够强。', '努力不一定成功，但不努力真的好舒服。'],
  },
  {
    id: 'chp',
    label: '彩虹屁',
    url: 'https://api.shadiao.app/chp',
    extract: d => d?.data?.text ?? '',
    fallback: ['您真是一股清流！', '如此优秀，是上天的恩赐。', '今天的风，都是为您而吹。'],
  },
  {
    id: 'shici',
    label: '诗词',
    url: 'https://api.shadiao.app/shici',
    extract: d => {
      const c = d?.data
      if (!c) return ''
      return `${c.content ?? ''}——${c.author ?? ''}《${c.title ?? ''}》`
    },
    fallback: ['春风又绿江南岸，明月何时照我还。——王安石《泊船瓜洲》'],
  },
  {
    id: 'qinghua',
    label: '土味情话',
    url: 'https://api.vvhan.com/api/text/qinghua',
    extract: d => d?.data?.content ?? d?.content ?? '',
    fallback: ['你是我的优乐美，我想把你捧在手心。'],
  },
  {
    id: 'du',
    label: '语录',
    url: 'https://api.vvhan.com/api/text/du',
    extract: d => d?.data?.content ?? d?.content ?? '',
    fallback: ['路漫漫其修远兮，吾将上下而求索。'],
  },
  {
    id: 'riddle',
    label: '谜语',
    url: 'https://api.vvhan.com/api/text/riddle',
    extract: d => {
      const c = d?.data
      if (!c) return ''
      return `${c.title ?? ''}（${c.answer ?? ''}）`
    },
    fallback: ['画时圆，写时方，冬时短，夏时长（日）。'],
  },
  {
    id: 'hitokoto',
    label: '一言',
    url: 'https://v1.hitokoto.cn/?encode=json',
    extract: d => `${d?.hitokoto ?? ''} —— ${d?.from ?? ''}`,
    fallback: ['愿你走出半生，归来仍是少年。'],
  },
  {
    id: 'quote',
    label: '励志',
    url: 'https://api.vvhan.com/api/text/quote',
    extract: d => d?.data?.content ?? d?.content ?? '',
    fallback: ['星光不问赶路人，时光不负有心人。'],
  },
]

/** 通用：拿一个 API 的内容（缓存 + 降级） */
export const fetchOne = async (id: ApiId): Promise<string> => {
  const cacheKey = `api:${id}`
  const cached = getCached<string>(cacheKey)
  if (cached) return cached
  const cfg = APIS.find(a => a.id === id)
  if (!cfg) return ''
  try {
    const data = await fetchWithTimeout<any>(cfg.url)
    const text = cfg.extract(data)
    if (text) {
      setCached(cacheKey, text)
      return text
    }
    throw new Error('empty')
  } catch {
    const fb = cfg.fallback
    return fb[Math.floor(Math.random() * fb.length)]!
  }
}

/** 多个 API 并发，任意一个先成功就采用 */
export const fetchAny = async (ids: ApiId[]): Promise<{ id: ApiId; text: string }> => {
  const promises = ids.map(async id => {
    const text = await fetchOne(id)
    return { id, text }
  })
  // Promise.any 在 ES2021+；保险降级为 allSettled
  if (typeof Promise.any === 'function') {
    return Promise.any(promises).catch(() => fallbackText(ids))
  }
  return Promise.allSettled(promises).then(results => {
    const ok = results.find(r => r.status === 'fulfilled') as PromiseFulfilledResult<{ id: ApiId; text: string }> | undefined
    return ok ? ok.value : fallbackText(ids)
  })
}

const fallbackText = (ids: ApiId[]): { id: ApiId; text: string } => {
  const fb = APIS.find(a => a.id === ids[0])?.fallback ?? APIS[0]!.fallback
  return { id: ids[0] ?? 'love', text: fb[Math.floor(Math.random() * fb.length)]! }
}
