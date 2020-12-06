import { $ } from '../lib/util.js'
import { EventEmitter } from '../lib/event.js'
import { Button, setPointerTarget } from '../lib/button.js'
import { clearResult } from '../leaderboard/leaderboard.js'

export const screenWidth = 640
export const screenHeight = 320

const $app = $('.app')
const $world = $('.world')
const $bg = $('.bg')
const emitter = new EventEmitter()

let initFunc = null
let updateFunc = null
let playing = false
let finished = false
let worldX = 0
let worldY = 0
let worldTargetX = 0
let worldTargetY = 0
let worldViewX = 0
let worldViewY = 0
let tickCount = 0
const waits = new Set()
const fps = 60

export const button = new Button([' ', 'z', 'ArrowUp', 'pointer'])
export const reset = new Button(['Escape', 'Enter'])

export function init() {
  playing = false
  finished = false
  worldX = 0
  worldY = 0
  worldTargetX = 0
  worldTargetY = 0
  worldViewX = 0
  worldViewY = 0
  tickCount = 0
  setPointerTarget()
  toggleFlash(false)
  waits.clear()
  button.init()
  initFunc()
  emitter.emit('init')
}

function update() {
  setTimeout(update, 1000 / fps)
  tickCount++
  button.update()
  reset.update()

  for (const wait of waits) {
    if ((tickCount - wait.startCount) * 1000 / fps >= wait.time) {
      waits.delete(wait)
      wait.resolve()
    }
  }

  updateFunc()

  worldTargetX += (worldX - worldTargetX) / 4
  worldTargetY += (worldY - worldTargetY) / 4
  worldViewX = worldTargetX - screenWidth * 0.05
  worldViewY = worldTargetY - screenHeight * 0.8
  $world.style.transform = `translate(${-worldViewX}px, ${-worldViewY}px)`
}

export function setInit(func) {
  initFunc = func
}

export function setUpdate(func) {
  updateFunc = func
}

export function appendWorldChild(...nodes) {
  $world.append(...nodes)
}

export function appendScreenChild(...nodes) {
  $app.append(...nodes)
}

export function getViewRect() {
  return {
    left: worldViewX ,
    top: worldViewY,
    right: worldViewX + screenWidth,
    bottom: worldViewY + screenHeight,
    width: screenWidth,
    height: screenHeight,
  }
}

export function start() {
  playing = true
  emitter.emit('start')
}

export function finish() {
  playing = false
  finished = true
  emitter.emit('finish')
}

export function isFinished() {
  return finished
}

export function isPlaying() {
  return playing
}

export function scrollTo(x, y) {
  worldX = x
  worldY = y
}

export function on(type, func) {
  return emitter.on(type, func)
}

export function once(type, func) {
  return emitter.once(type, func)
}

export function off(type, func) {
  return emitter.off(type, func)
}

export function wait(time) {
  return new Promise(resolve => {
    waits.add({ resolve, startCount: tickCount, time })
  })
}

export function toggleFlash(value) {
  $bg.classList.toggle('flash', value)
}

export function limitPointingArea() {
  setPointerTarget($app)
}

setTimeout(() => {
  document.body.style.display = 'block'
  init()
  update()
}, 1)

reset.on('down', () => {
  clearResult()
  init()
})

window.addEventListener('popstate', () => {
  $app.classList.add('init')
  requestAnimationFrame(() => requestAnimationFrame(() => $app.classList.remove('init')))
  setTimeout(init, 1)
})
