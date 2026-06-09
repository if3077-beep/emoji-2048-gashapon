/**
 * 持久化（localStorage 简单版，避免 IndexedDB 复杂）
 */
const KEY = 'gashapon-2048-save-v1'

export interface SaveData {
  version: number
  savedAt: number
  state: any  // 由 store 定义
}

export const loadSave = (): any | null => {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return null
    const data: SaveData = JSON.parse(raw)
    if (data.version !== 1) return null
    return data.state
  } catch {
    return null
  }
}

export const writeSave = (state: any) => {
  try {
    const data: SaveData = {
      version: 1,
      savedAt: Date.now(),
      state,
    }
    localStorage.setItem(KEY, JSON.stringify(data))
  } catch {
    // quota exceeded — ignore
  }
}

export const clearSave = () => {
  try {
    localStorage.removeItem(KEY)
  } catch {}
}
