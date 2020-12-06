import * as app from '../app/app.js'
import { $, toDelimited } from '../lib/util.js'
import { getResult } from '../leaderboard/leaderboard.js'
import * as audio from '../audio/audio.js'

const $status = $('.status')
const $powerValue = $('.status .power .value')
const $scoreCurrent = $('.status .score .current')
const $timeExponent = $('.status .time .exponent')
const $timeFraction = $('.status .time .fraction')
const $statusReplay = $('.status-replay')

let scoreTarget = 0
let score = 0
let timeLimit = 0

export function init() {
  setScoreTarget(1000000)
  setScore(0)
  setTimeLimit(60)
  setPower(0)
  app.toggleFlash(false)
  $status.classList.remove('show')
  $statusReplay.classList.remove('show')
}

export function update() {
  if (app.isPlaying()) {
    setTimeLimit(timeLimit - 1 / 60)

    if (timeLimit <= 0) {
      app.finish()
      audio.timeOver.play()
    }
  }
}

export function setScoreTarget(value) {
  scoreTarget = value
}

export function setScore(value) {
  score = value
  $scoreCurrent.textContent = toDelimited(getAdjustedScore())
}

export function getScore() {
  return score
}

export function getAdjustedScore() {
  return Math.floor(score / 100) * 100
}

export function getScoreTarget() {
  return scoreTarget
}

export function isScoreOver() {
  return score >= scoreTarget
}

export function setPower(value) {
  $powerValue.textContent = Math.floor(value)
}

function setTimeLimit(sec) {
  timeLimit = Math.max(sec, 0)
  const e = Math.floor(timeLimit)
  $timeExponent.textContent = e
  $timeFraction.textContent = String(Math.floor((timeLimit - e) * 100)).padStart(2, '0')
}

app.on('start', () => {
  $status.classList.add('show')
  $statusReplay.classList.toggle('show', !!getResult())
})

app.on('finish', () => {
  app.toggleFlash(false)
  $status.classList.remove('show')
  $statusReplay.classList.remove('show')
})
