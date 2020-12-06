import * as app from '../app/app.js'
import * as status from '../status/status.js'
import * as player from '../player/player.js'
import { html, randomNative } from '../lib/util.js'

let list = []
let lastAngle = 0

export function init() {
  for (const item of list) {
    item.remove()
  }
  list = []
}

export function update() {
  if (player.me.isDead) {
    return
  }

  for (const item of list.slice()) {
    if (item.hitTest()) {
      item.flashMove()
      player.me.powerUp()
      player.me.flash()
      list.splice(list.indexOf(item), 1)
    }
  }

  if (app.isPlaying() && !player.me.isDead) {
    while (list.length && list[0].removeTest()) {
      list[0].remove()
      list.shift()
      player.me.powerDown()
    }
  }
}

export function create({ x, y }) {
  list.push(new Item({ x, y }))
}

export class Item {
  constructor(options) {
    this.el = html`
      <svg class="item" viewBox="20 13 70 70">
        <path d="M80.44,23.94c-6.85-5.84-17-4.79-23.32,1.7l-2.46,2.53-2.47-2.53c-6.27-6.49-16.47-7.54-23.32-1.7a17.94,17.94,0,0,0-1.24,26l24.19,25a3.92,3.92,0,0,0,5.66,0l24.19-25a17.93,17.93,0,0,0-1.23-26Z"/>
      </svg>
    `
    this.x = 0
    this.y = 0
    this.size = 30

    Object.assign(this, options)
    Object.assign(this.el.style, { left: `${options.x}px`, top: `${options.y}px` })
    app.appendWorldChild(this.el)
  }

  hitTest() {
    const d = Math.sqrt((this.x - player.me.x) ** 2 + (this.y - player.me.y) ** 2)
    const r = player.me.size / 2 + this.size / 2
    return d < r
  }

  flashMove() {
    lastAngle = (lastAngle + randomNative(300) + 30) % 360
    const rad = lastAngle * (Math.PI / 180)
    const vRect = app.getViewRect()
    const startScale = randomNative(10) / 10 + 1.5
    const startLeft = player.me.x - vRect.left + Math.cos(rad) * 50 * (3 - startScale)
    const startTop = player.me.y - vRect.top + Math.sin(rad) * 50 * (3 - startScale)
    const endLeft = startLeft - player.me.vx * 2
    const endScale = startScale - 0.5

    const anime = this.el.animate(
      [
        { left: `${startLeft}px`, top: `${startTop}px`, transform: `scale(${startScale})` },
        { left: `${endLeft}px`, top: `${startTop}px`, transform: `scale(${endScale})` }
      ],
      { duration: 400, easing: 'ease-in' }
    )

    anime.onfinish = () => this.el.remove()

    app.appendScreenChild(this.el)
    this.el.classList.add('flash')
  }

  removeTest() {
    return this.x + this.size / 2 < app.getViewRect().left
  }

  remove() {
    this.el.remove()
  }
}
