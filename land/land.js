import * as app from '../app/app.js'
import * as status from '../status/status.js'
import * as player from '../player/player.js'
import * as item from '../item/item.js'
import { div } from '../lib/util.js'

let list = []

export function init() {
  for (const land of list) {
    land.remove()
  }
  list = []
}

export function update() {
  if (player.me.isDead) {
    return
  }

  let isLand = false

  for (const land of list) {
    if (land.includeTest()) {
      if (land.landTest()) {
        isLand = true
        player.me.putLand(land.y)
      } else if (land.sinkTest()) {
        player.me.die()
        app.finish()
      }
      break
    }
  }

  player.me.isLand = isLand

  if (app.isPlaying() && !player.me.isDead) {
    while (list.length && list[0].removeTest()) {
      list[0].remove()
      list.shift()
    }
  }
}

export function create({ x, y, isEmpty = false }) {
  if (list.length) {
    list[list.length - 1].setRight(x)
  }

  const land = new Land({ x, y, width: 100000, isEmpty })

  list.push(land)
}

export class Land {
  constructor(options) {
    this.el = div('.land')
    this.x = 0
    this.y = 0
    this.width = 0
    this.isEmpty = false

    Object.assign(this, options)
    Object.assign(this.el.style, {
      left: `${options.x}px`,
      top: `${options.y}px`,
      width: `${options.width}px`,
    })

    if (options.isEmpty) {
      this.el.classList.add('empty')
    }

    app.appendWorldChild(this.el)
  }

  includeTest() {
    return this.x <= player.me.x && player.me.x < (this.x + this.width)
  }

  landTest() {
    if (!this.isEmpty) {
      if (player.me.isLand) {
        return true
      }
      if (player.me.vy > 0) {
        const py = player.me.y + player.me.size / 2
        const oldPy = py - player.me.vy * 2
        return oldPy <= this.y && py >= this.y
      }
    }
    return false
  }

  sinkTest() {
    return player.me.y > this.y
  }

  setRight(x) {
    this.width = x - this.x
    this.el.style.width = `${this.width}px`
  }

  removeTest() {
    return this.x + this.width < app.getViewRect().left
  }

  remove() {
    this.el.remove()
  }
}
