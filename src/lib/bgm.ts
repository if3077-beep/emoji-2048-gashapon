/**
 * BGM 系统 v1.3
 * - 3 首循环音乐：休闲/战斗/觉醒
 * - 4 层：melody + bass + chord pad + arp
 * - Web Audio API 合成（无文件，零依赖）
 * - 启动淡入 + 停止淡出 + 低通滤波让音色更温暖
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
  /** v1.3 和声 pad（每个 chord 4 拍，3 个音） */
  chord: number[][]
  /** v1.3 琶音（可选） */
  arp?: number[]
  arpBeats?: number[]
  /** 主音量（0-1） */
  volume: number
  /** 波形 */
  wave: OscillatorType
  /** v1.3 滤波截止，让音色更柔 */
  filterFreq: number
  /** v1.3 reverb 强度（0-1） */
  reverb: number
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
    bpm: 84,
    melody: [5, 3, 1, 3, 5, 6, 5, 3, 5, 6, 8, 6, 5, 3, 1, 3],
    melodyBeats: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 2],
    bass: [1, 5, 4, 5, 1, 5, 3, 5],
    bassBeats: [2, 2, 2, 2, 2, 2, 2, 2],
    // C, Am, F, G 三和弦（v1.3）
    chord: [
      [1, 3, 5], [6, 1, 3], [4, 6, 1], [5, 7, 2],
      [1, 3, 5], [6, 1, 3], [4, 6, 1], [5, 7, 2],
    ],
    arp: [1, 3, 5, 8, 5, 3],
    arpBeats: [0.5, 0.5, 0.5, 0.5, 0.5, 0.5],
    volume: 0.04,
    wave: 'sine',
    filterFreq: 2200,
    reverb: 0.18,
  },
  battle: {
    bpm: 132,
    melody: [5, 6, 7, 8, 7, 6, 5, 3, 5, 6, 7, 5, 6, 7, 5, 3],
    melodyBeats: [0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 1, 1],
    bass: [1, 1, 5, 5, 4, 4, 1, 1],
    bassBeats: [1, 1, 1, 1, 1, 1, 1, 1],
    chord: [
      [1, 3, 5], [5, 7, 2], [4, 6, 1], [5, 7, 2],
      [1, 3, 5], [5, 7, 2], [4, 6, 1], [5, 7, 2],
    ],
    volume: 0.05,
    wave: 'square',
    filterFreq: 3500,
    reverb: 0.10,
  },
  awaken: {
    bpm: 100,
    melody: [8, 7, 6, 5, 6, 7, 8, 5, 3, 5, 6, 7, 8, 8, 7, 6, 5, 3, 5, 6, 7, 8],
    melodyBeats: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    bass: [1, 5, 4, 5, 6, 5, 4, 1],
    bassBeats: [2, 2, 2, 2, 2, 2, 2, 2],
    chord: [
      [3, 5, 7], [5, 7, 2], [4, 6, 1], [6, 1, 3],
      [3, 5, 7], [5, 7, 2], [4, 6, 1], [6, 1, 3],
    ],
    arp: [8, 7, 6, 5, 6, 7, 8, 7],
    arpBeats: [0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5],
    volume: 0.05,
    wave: 'sine',
    filterFreq: 2800,
    reverb: 0.25,
  },
}

export class BgmPlayer {
  private ctx: AudioContext | null = null
  private gain: GainNode | null = null
  private filter: BiquadFilterNode | null = null
  private convolver: ConvolverNode | null = null
  private playing = false
  private currentTrack: keyof typeof BGMS = 'casual'
  private timers: number[] = []
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
      // v1.3 master gain + 低通滤波 + convolver reverb
      this.gain = this.ctx.createGain()
      this.gain.gain.value = 0  // 启动时从 0 淡入
      this.gain.gain.linearRampToValueAtTime(this.muted ? 0 : this.masterVolume, this.ctx.currentTime + 1.2)
      this.filter = this.ctx.createBiquadFilter()
      this.filter.type = 'lowpass'
      this.filter.frequency.value = BGMS[this.currentTrack].filterFreq
      // v1.3：合成 IR 用于 reverb
      this.convolver = this.ctx.createConvolver()
      this.convolver.buffer = this.makeReverbIR(BGMS[this.currentTrack].reverb)
      // 路由：sources -> filter -> gain -> destination
      //                 \-> convolver -> gain(2nd) -> destination
      this.filter.connect(this.gain)
      this.convolver.connect(this.gain)
      this.gain.connect(this.ctx.destination)
      this.playing = true
      this.startMelody()
      this.startBass()
      this.startChord()
      if (BGMS[this.currentTrack].arp) this.startArp()
    } catch (e) {
      console.warn('BGM play failed', e)
    }
  }

  stop() {
    if (!this.playing) return
    this.playing = false
    this.timers.forEach(t => clearTimeout(t))
    this.timers = []
    // 淡出后关闭
    if (this.gain && this.ctx) {
      const t = this.ctx.currentTime
      this.gain.gain.cancelScheduledValues(t)
      this.gain.gain.setValueAtTime(this.gain.gain.value, t)
      this.gain.gain.linearRampToValueAtTime(0, t + 0.5)
      setTimeout(() => {
        if (this.ctx) this.ctx.close().catch(() => {})
        this.ctx = null
        this.gain = null
        this.filter = null
        this.convolver = null
      }, 600)
    }
  }

  /** v1.3 简易 reverb IR（衰减噪声） */
  private makeReverbIR(secs: number): AudioBuffer {
    if (!this.ctx) throw new Error('no ctx')
    const length = Math.max(1, Math.floor(this.ctx.sampleRate * secs * 4))
    const buf = this.ctx.createBuffer(2, length, this.ctx.sampleRate)
    for (let c = 0; c < 2; c++) {
      const d = buf.getChannelData(c)
      for (let i = 0; i < length; i++) {
        d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, 2.5)
      }
    }
    return buf
  }

  private scheduleNote(freq: number, dur: number, volume: number, sendReverb: boolean) {
    if (!this.ctx || !this.filter) return
    const osc = this.ctx.createOscillator()
    const g = this.ctx.createGain()
    osc.type = BGMS[this.currentTrack].wave
    osc.frequency.value = freq
    g.gain.setValueAtTime(0, this.ctx.currentTime)
    g.gain.linearRampToValueAtTime(volume, this.ctx.currentTime + 0.02)
    g.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + dur * 0.95)
    osc.connect(g)
    g.connect(this.filter)
    if (sendReverb && this.convolver) {
      const wet = this.ctx.createGain()
      wet.gain.value = BGMS[this.currentTrack].reverb
      g.connect(wet)
      wet.connect(this.convolver)
    }
    osc.start()
    osc.stop(this.ctx.currentTime + dur)
  }

  private startMelody() {
    const cfg = BGMS[this.currentTrack]
    let idx = 0
    const tick = () => {
      if (!this.playing) return
      const beatDur = 60 / cfg.bpm
      const note = cfg.melody[idx]!
      const beats = cfg.melodyBeats[idx]!
      const dur = beats * beatDur
      this.scheduleNote(noteFreq(note), dur, cfg.volume * 2, true)
      idx = (idx + 1) % cfg.melody.length
      this.timers.push(window.setTimeout(tick, dur * 1000))
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
      this.scheduleNote(noteFreq(note) / 2, dur, cfg.volume * 3, false)
      idx = (idx + 1) % cfg.bass.length
      this.timers.push(window.setTimeout(tick, dur * 1000))
    }
    tick()
  }

  /** v1.3 和声 pad：每个 chord 4 拍 */
  private startChord() {
    const cfg = BGMS[this.currentTrack]
    let idx = 0
    const tick = () => {
      if (!this.playing) return
      const beatDur = 60 / cfg.bpm
      const chord = cfg.chord[idx]!
      const dur = 4 * beatDur
      chord.forEach(n => {
        this.scheduleNote(noteFreq(n), dur, cfg.volume * 0.7, true)
      })
      idx = (idx + 1) % cfg.chord.length
      this.timers.push(window.setTimeout(tick, dur * 1000))
    }
    tick()
  }

  /** v1.3 琶音：高频点缀 */
  private startArp() {
    const cfg = BGMS[this.currentTrack]
    const arp = cfg.arp
    const arpBeats = cfg.arpBeats
    if (!arp || !arpBeats) return
    let idx = 0
    const tick = () => {
      if (!this.playing) return
      const beatDur = 60 / cfg.bpm
      const note = arp[idx]!
      const beats = arpBeats[idx]!
      const dur = beats * beatDur * 0.9
      this.scheduleNote(noteFreq(note), dur, cfg.volume * 1.2, true)
      idx = (idx + 1) % arp.length
      this.timers.push(window.setTimeout(tick, dur * 1000))
    }
    tick()
  }
}

export const bgm = new BgmPlayer()
