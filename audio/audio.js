let mute = localStorage.getItem('audio-mute') === 'true'

const AudioContext = window.AudioContext || window.webkitAudioContext

let ctx = null

const ctxPromise = new Promise(resolve => {
  for (const type of ['touchend', 'mouseup', 'keyup']) {
    document.addEventListener(type, resolve)
  }
}).then(async () => {
  ctx = new AudioContext()
  await ctx.resume()
  return ctx
})

function getCtx(cb) {
  if (ctx) {
    cb(ctx)
  } else {
    ctxPromise.then(cb)
  }
}

class Se {
  constructor(src, volume = 1, minTime = 0) {
    this.src = src
    this.minTime = minTime
    this.volume = volume
    this.audioBuffer = null
    this.gainNode = null
    this.startTime = 0
    this.audioSource = null

    if (src) {
      const url = new URL(src, import.meta.url).href
      const abPromise = fetch(url).then(res => res.arrayBuffer())
      this.audioBufferPromise = Promise.all([ ctxPromise, abPromise ])
        .then(([ctx, ab]) => new Promise(r => ctx.decodeAudioData(ab, r)))
        .then((ab) => (this.audioBuffer = ab))
    }
  }

  play() {
    if (!this.src || mute) return
    getCtx(ctx => {
      this.getAudioBuffer(audioBuffer => {
        this.getGainNode(gainNode => {
          if (ctx.currentTime - this.startTime >= this.minTime) {
            if (this.audioSource) {
              this.audioSource.stop()
            }
            this.audioSource = this.createAudioSource(audioBuffer)
            this.audioSource.connect(gainNode)
            this.audioSource.start()
            this.startTime = ctx.currentTime
          }
        })
      })
    })
  }

  getGainNode(cb) {
    if (this.gainNode) {
      cb(this.gainNode)
    } else {
      getCtx(ctx => {
        this.gainNode = ctx.createGain()
        this.gainNode.gain.value = this.volume
        this.gainNode.connect(ctx.destination)
        cb(this.gainNode)
      })
    }
  }

  getAudioBuffer(cb) {
    if (this.audioBuffer) {
      cb(this.audioBuffer)
    } else {
      this.audioBufferPromise.then(cb)
    }
  }

  createAudioSource(audioBuffer) {
    const audioSource = ctx.createBufferSource()
    audioSource.buffer = audioBuffer
    return audioSource
  }
}

export function isMute() {
  return !!mute
}

export function setMute(value) {
  value = !!value
  if (mute !== value) {
    mute = value
    localStorage.setItem('audio-mute', value)
    for (const listener of changeMuteListeners) {
      listener()
    }
  }
}

const changeMuteListeners = []

export function onChangeMute(listener) {
  changeMuteListeners.push(listener)
  listener()
}

export const start = new Se('se_itemget_006.mp3', 0.9)
export const jump = new Se('cursor(katai).mp3', 0.6)
export const landing = new Se('cursor(katai)2.mp3', 0.6)
export const hovering = new Se('se_noise_2.mp3', 0.2)
export const powerUp = new Se('se_shot_003.wav', 0.08, 0.02)
export const scoreUp = new Se('')
export const scoreOver = new Se('yakedo.mp3', 0.3)
export const timeOver = new Se('se_denshion_1a.mp3', 0.4)
export const counting = new Se('kettei_shoukettei(katai)2.wav', 0.08, 0.04)
export const success = new Se('se_breakout_2a.mp3', 0.5)
export const sink = new Se('sonohoka_kazewokiru.mp3', 0.2)
