/**
 * BGM 系统 v0.5
 * - 3 首循环音乐：休闲/战斗/觉醒
 * - Web Audio API 合成（无文件，零依赖）
 * - 节奏型旋律循环
 */

interface BgmConfig {
  bpm: number
  /** 旋律音符（C 大调 1=C4, 2=D4, 3=E4, 4=F4, 5=G4, 6=A4, 7=B4, 8=C5） */
  melody: number[]
  /** 旋律每个音符的拍数 */
  melodyBeats: number[]
  /** 底部 pad 音符 */
  bass: number[]
  /** pad 拍数 */
  bassBeats: number[]
  /** 主音量（0-1） */
  volume: number
  /** 波形 */
  wave: OscillatorType
}

const noteFreq = (n: number): number => {
  // 半音映射（C, C#, D, D#, E, F, F#, G, G#, A, A#, B, C+）
  const semitones = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
  const oct = Math.floor((n - 1) / 7)
  const sem = semitones[(n - 1) % 7] ?? 0
  return 261.63 * Math.pow(2, oct + sem / 12)
}

const BGMS: Record<'casual' | 'battle' | 'awaken', BgmConfig> = {
  casual: {
    bpm: 80,
    melody: [1, 3, 5, 3, 1, 2, 4, 2, 1, 3, 5, 6, 5, 3, 1, 3],
    melodyBeats: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 2],
    bass: [1, 5, 4, 5, 1, 5, 3, 5],
    bassBeats: [2, 2, 2, 2, 2, 2, 2, 2],
    volume: 0.04,
    wave: 'sine',
  },
  battle: {
    bpm: 130,
    melody: [5, 6, 7, 8, 7, 6, 5, 3, 5, 6, 7, 5, 6, 7, 5, 3],
    melodyBeats: [0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 1, 1],
    bass: [1, 1, 5, 5, 4, 4, 1, 1],
    bassBeats: [1, 1, 1, 1, 1, 1, 1, 1],
    volume: 0.05,
    wave: 'square',
  },
  awaken: {
    bpm: 100,
    melody: [8, 7, 6, 5, 6, 7, 8, 5, 3, 5, 6, 7, 8, 8, 7, 6, 5, 3, 5, 6, 7, 8],
    melodyBeats: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    bass: [1, 5, 4, 5, 6, 5, 4, 1],
    bassBeats: [2, 2, 2, 2, 2, 2, 2, 2],
    volume: 0.04,
    wave: 'sine',
  },
}

export class BgmPlayer {
  private ctx: AudioContext | null = null
  private gain: GainNode | null = null
  private playing = false
  private currentTrack: keyof typeof BGMS = 'casual'
  private melodyTimer: number | null = null
  private bassTimer: number | null = null
  private muted = false
  private masterVolume = 0.5

  setMuted(m: boolean) {
    this.muted = m
    if (this.gain) this.gain.gain.value = m ? 0 : this.masterVolume
  }

  setVolume(v: number) {
    this.masterVolume = v
    if (this.gain && !this.muted) this.gain.gain.value = v
  }

  switchTo(track: keyof typeof BGMS) {
    this.currentTrack = track
    if (this.playing) {
      this.stop()
      this.play()
    }
  }

  play() {
    if (this.playing) return
    if (typeof window === 'undefined') return
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext
      if (!AudioCtx) return
      this.ctx = new AudioCtx()
      this.gain = this.ctx.createGain()
      this.gain.gain.value = this.muted ? 0 : this.masterVolume
      this.gain.connect(this.ctx.destination)
      this.playing = true
      this.startMelody()
      this.startBass()
    } catch (e) {
      console.warn('BGM play failed', e)
    }
  }

  stop() {
    this.playing = false
    if (this.melodyTimer) clearTimeout(this.melodyTimer)
    if (this.bassTimer) clearTimeout(this.bassTimer)
    this.melodyTimer = null
    this.bassTimer = null
  }

  private scheduleNext(prevGain: GainNode | null, freq: number, dur: number) {
    if (!this.ctx || !this.gain) return
    const osc = this.ctx.createOscillator()
    const g = this.ctx.createGain()
    osc.type = BGMS[this.currentTrack].wave
    osc.frequency.value = freq
    g.gain.setValueAtTime(0, this.ctx.currentTime)
    g.gain.linearRampToValueAtTime(BGMS[this.currentTrack].volume * 2, this.ctx.currentTime + 0.02)
    g.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + dur * 0.95)
    osc.connect(g)
    g.connect(this.gain)
    osc.start()
    osc.stop(this.ctx.currentTime + dur)
  }

  private startMelody() {
    const cfg = BGMS[this.currentTrack]
    let idx = 0
    let beatPos = 0
    const tick = () => {
      if (!this.playing) return
      const beatDur = 60 / cfg.bpm  // 秒
      const note = cfg.melody[idx]!
      const beats = cfg.melodyBeats[idx]!
      const dur = beats * beatDur
      this.scheduleNext(null, noteFreq(note), dur)
      beatPos += beats
      idx = (idx + 1) % cfg.melody.length
      this.melodyTimer = window.setTimeout(tick, dur * 1000)
    }
    tick()
  }

  private startBass() {
    const cfg = BGMS[this.currentTrack]
    let idx = 0
    const tick = () => {
      if (!this.playing) return
      const beatDur = 60 / cfg.bpm
      const note = cfg.bass[idx]!
      const beats = cfg.bassBeats[idx]!
      const dur = beats * beatDur
      this.scheduleNext(null, noteFreq(note) / 2, dur)  // 低 8 度
      idx = (idx + 1) % cfg.bass.length
      this.bassTimer = window.setTimeout(tick, dur * 1000)
    }
    tick()
  }
}

export const bgm = new BgmPlayer()
