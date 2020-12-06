import { EventEmitter } from './event.js'

let keyDowns = {}

addEventListener('contextmenu', e => e.preventDefault())

const scrollKeys = [
  ' ', 'Tab',
  'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight',
  'PageUp', 'PageDown', 'Home', 'End',
]

const inputElements = 'input, textarea, select, button'

addEventListener('keydown', e => {
  if (scrollKeys.includes(e.key) && !e.target.closest(`${inputElements}`)) {
    e.preventDefault()
  }
})

addEventListener('keydown', (e) => {
  if (!e.target.closest(`${inputElements}, [data-ignore-button-event]`)) {
    keyDowns[e.key] = true
  }
})
addEventListener('keyup', (e) => (keyDowns[e.key] = false))

let pointerTarget = document.documentElement

addEventListener('pointerdown', (e) => {
  if (pointerTarget.contains(e.target) && !e.target.closest(`${inputElements}, .clickable, [data-ignore-button-event]`)) {
    keyDowns[`pointer`] = true
  }
})
addEventListener('pointerup', (e) => {
  if (pointerTarget.contains(e.target)) {
    keyDowns[`pointer`] = false
  }
})
addEventListener('pointercancel', (e) => {
  if (pointerTarget.contains(e.target)) {
    keyDowns[`pointer`] = false
  }
})

export function setPointerTarget(el = null) {
  pointerTarget = el || document.documentElement
}

export class Button extends EventEmitter {
  constructor(keys) {
    super()
    this.isDown = false
    this.isChanged = false
    this.count = 0
    this.keys = keys
    this.logMode = ''
    this.log = []
    this.logIndex = 0
  }

  get isDownChanged() {
    return this.isDown && this.isChanged
  }

  get isUpChanged() {
    return !this.isDown && this.isChanged
  }

  init() {
    this.isDown = false
    this.isChanged = false
    this.count = 0
    this.logMode = ''
  }

  update() {
    if (this.logMode === 'play') {
      this.isChanged = this.log[this.logIndex] === this.count
      if (this.isChanged) {
        this.logIndex++
      }
    } else {
      this.isChanged = this.isDown !== this.keys.some(key => keyDowns[key])
    }

    if (this.logMode === 'rec') {
      if (this.isChanged) {
        this.log.push(0)
        this.logIndex++
      } else {
        this.log[this.logIndex]++
      }
    }

    if (this.isChanged) {
      this.isDown = !this.isDown
      this.count = 0
      this.emit(this.isDown ? 'down' : 'up')
    } else {
      this.count++
    }
  }

  recLog() {
    this.init()
    this.logMode = 'rec'
    this.log = [0]
    this.logIndex = 0
  }

  stopLog() {
    this.logMode = ''
  }

  playLog(log) {
    this.init()
    this.logMode = 'play'
    this.log = log
    this.logIndex = 0
  }
}
