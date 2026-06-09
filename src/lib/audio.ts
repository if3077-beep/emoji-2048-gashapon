/**
 * 音效管理（Web Audio API 即时合成，无需音频文件）
 * 优点：零依赖、零加载、体积小、可编程
 */
let ctx: AudioContext | null = null
let muted = false

const getCtx = (): AudioContext | null => {
  if (typeof window === 'undefined') return null
  if (!ctx) {
    try {
      ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
    } catch {
      return null
    }
  }
  return ctx
}

export const setMuted = (m: boolean) => {
  muted = m
}

export const isMuted = (): boolean => muted

export const resumeAudio = () => {
  const c = getCtx()
  if (c && c.state === 'suspended') c.resume()
}

interface Note {
  freq: number
  dur: number
  type?: OscillatorType
  volume?: number
  delay?: number
  freqEnd?: number
}

const play = (notes: Note[]) => {
  if (muted) return
  const c = getCtx()
  if (!c) return
  const t0 = c.currentTime
  for (const n of notes) {
    const start = t0 + (n.delay ?? 0)
    const o = c.createOscillator()
    const g = c.createGain()
    o.type = n.type ?? 'sine'
    o.frequency.setValueAtTime(n.freq, start)
    if (n.freqEnd) o.frequency.exponentialRampToValueAtTime(n.freqEnd, start + n.dur)
    const v = n.volume ?? 0.08
    g.gain.setValueAtTime(0, start)
    g.gain.linearRampToValueAtTime(v, start + 0.01)
    g.gain.exponentialRampToValueAtTime(0.001, start + n.dur)
    o.connect(g)
    g.connect(c.destination)
    o.start(start)
    o.stop(start + n.dur + 0.02)
  }
}

export const sfx = {
  /** 投币 */
  coin: () =>
    play([
      { freq: 1800, freqEnd: 2400, dur: 0.12, type: 'sine', volume: 0.1 },
      { freq: 3600, freqEnd: 4800, dur: 0.08, type: 'sine', volume: 0.05, delay: 0.06 },
    ]),
  /** 摇杆 */
  lever: () => {
    if (muted) return
    const c = getCtx()
    if (!c) return
    const t0 = c.currentTime
    const buf = c.createBuffer(1, c.sampleRate * 0.06, c.sampleRate)
    const data = buf.getChannelData(0)
    for (let i = 0; i < data.length; i++)
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (c.sampleRate * 0.015))
    const src = c.createBufferSource()
    src.buffer = buf
    const g = c.createGain()
    g.gain.setValueAtTime(0.06, t0)
    g.gain.exponentialRampToValueAtTime(0.001, t0 + 0.06)
    const f = c.createBiquadFilter()
    f.type = 'lowpass'
    f.frequency.value = 400
    src.connect(f)
    f.connect(g)
    g.connect(c.destination)
    src.start(t0)
    src.stop(t0 + 0.06)
  },
  /** 蛋壳裂开 */
  crack: () =>
    play([
      { freq: 600, freqEnd: 1200, dur: 0.1, type: 'sine', volume: 0.1 },
      { freq: 2200, dur: 0.05, type: 'triangle', volume: 0.05, delay: 0.08 },
      { freq: 3200, dur: 0.06, type: 'triangle', volume: 0.04, delay: 0.13 },
    ]),
  /** 合并 */
  merge: (level = 1) => {
    const base = 400 + level * 50
    play([
      { freq: base, dur: 0.15, type: 'sine', volume: 0.07 },
      { freq: base + 120, dur: 0.15, type: 'sine', volume: 0.06, delay: 0.06 },
      { freq: base + 240, dur: 0.15, type: 'sine', volume: 0.05, delay: 0.12 },
    ])
  },
  /** 升级/稀有 */
  rare: () =>
    play([
      { freq: 1200, dur: 0.18, type: 'sine', volume: 0.06 },
      { freq: 1550, dur: 0.18, type: 'sine', volume: 0.05, delay: 0.08 },
      { freq: 1900, dur: 0.18, type: 'sine', volume: 0.04, delay: 0.16 },
      { freq: 2400, dur: 0.2, type: 'sine', volume: 0.05, delay: 0.26 },
    ]),
  /** 宠物进化 */
  evolve: (level = 1) => {
    const base = 300 + level * 40
    play([
      { freq: base, dur: 0.32, type: 'triangle', volume: 0.08 },
      { freq: base + 180, dur: 0.32, type: 'triangle', volume: 0.07, delay: 0.12 },
      { freq: base + 360, dur: 0.4, type: 'triangle', volume: 0.07, delay: 0.24 },
    ])
  },
  /** 喂食 */
  feed: () =>
    play([
      { freq: 800, dur: 0.08, type: 'sine', volume: 0.05 },
      { freq: 1150, dur: 0.08, type: 'sine', volume: 0.05, delay: 0.05 },
    ]),
  /** 失败 */
  fail: () =>
    play([{ freq: 250, freqEnd: 80, dur: 0.14, type: 'sawtooth', volume: 0.04 }]),
  /** 按钮点击 */
  tap: () => play([{ freq: 1000, freqEnd: 1400, dur: 0.05, type: 'sine', volume: 0.05 }]),
  /** 庆祝 */
  celebrate: () =>
    play([
      { freq: 523, dur: 0.2, type: 'triangle', volume: 0.06 },
      { freq: 659, dur: 0.2, type: 'triangle', volume: 0.06, delay: 0.1 },
      { freq: 784, dur: 0.3, type: 'triangle', volume: 0.07, delay: 0.2 },
      { freq: 1047, dur: 0.4, type: 'triangle', volume: 0.07, delay: 0.3 },
    ]),
}
