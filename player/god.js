import * as app from '../app/app.js'
import * as status from '../status/status.js'
import * as player from '../player/player.js'
import * as item from '../item/item.js'
import * as land from '../land/land.js'
import { random } from '../lib/util.js'

export const version = '0'
const landY = 15

let y = 0
let vy = 0
let isLand = false
let isEmpty = false
let noJumpCount = 0
let restItemCount = 0
let lastItemX = 0
let itemY = null

export function init() {
  y = landY
  vy = 0
  isLand = true
  isEmpty = false
  noJumpCount = 300
  restItemCount = 0
  lastItemX = 0
  itemY = null
  land.create({ x: -640, y })
}

export function update() {
  if (app.isPlaying()) {
    noJumpCount--
  }
  const x = player.me.x + 640

  if (isLand) {
    vy = 0
  } else {
    vy = Math.min(vy + 0.5, 30)
    y += vy
  }

  if (player.me.isDead || !app.isPlaying()) {
    return
  }

  if (!isLand && y > landY) {
    isLand = true
    y = landY
    noJumpCount = 120
    restItemCount = 0
  }

  if (vy < 0 && vy >= -9 && !isEmpty && !status.isScoreOver()) {
    isEmpty = true
    land.create({ x, y: landY, isEmpty })
  }

  if (vy > 0 && vy >= 9 && isEmpty) {
    isEmpty = false
    land.create({ x, y: landY, isEmpty })
  }

  if (status.isScoreOver() && noJumpCount > 15) {
    noJumpCount = 15
  }

  if (player.me.vx >= 10 && !restItemCount && x - lastItemX > 800) {
    if (isLand && noJumpCount < 0 && (status.isScoreOver() || random(2) === 0)) {
      isLand = false
      vy = -12
      restItemCount = status.isScoreOver() ? 9999 : (5 + Math.floor(player.me.power / 20))
      itemY = null
    } else if (!status.isScoreOver()) {
      restItemCount = 5 + Math.floor(player.me.power / 20)
      itemY = status.isScoreOver() ? 0 : [0, -120][random(2)]
    }
  }

  if (restItemCount && x - lastItemX > 40) {
    restItemCount--
    lastItemX = x
    if (itemY === null) {
      item.create({ x, y: y - player.me.size / 2 })
    } else {
      item.create({ x, y: itemY })
    }
  }
}

