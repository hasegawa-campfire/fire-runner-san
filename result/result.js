import * as app from '../app/app.js'
import * as status from '../status/status.js'
import { $, toDelimited, setRandomSeed, updateRandomSeed } from '../lib/util.js'
import { getResult, createResult, clearResult, pushUrl } from '../leaderboard/leaderboard.js'
import * as audio from '../audio/audio.js'

const $result = $('.result')
const $scoreCurrent = $('.result .score .current')
const $scoreTarget = $('.result .score .target')
const $scoreSuccess = $('.result .score .success')
const $scoreGauge = $('.result .score-gauge')

let isActive = false
let randomSeed = 0

export function init() {
  $result.classList.remove('show')
  isActive = false
}

export function update() {
  if (isActive && app.button.isUpChanged) {
    clearResult()
    app.init()
    app.start()
    audio.start.play()
  }
}

export async function show() {
  $scoreCurrent.textContent = '0'
  $scoreTarget.textContent = toDelimited(status.getScoreTarget())
  $scoreGauge.style.backgroundSize = ''
  $scoreSuccess.classList.remove('show')
  $result.classList.add('show')

  await app.wait(1800)
  await countUpAnime()

  if (status.isScoreOver()) {
    $scoreSuccess.classList.add('show')
  }

  await app.wait(300)
  isActive = true
  app.limitPointingArea()
}

function countUpAnime() {
  return new Promise(resolve => {
    const time = Date.now()

    const anime = () => {
      const rate = Math.min(Date.now() - time, 500) / 500
      const value = rate * status.getAdjustedScore()
      $scoreCurrent.textContent = toDelimited(Math.floor(value))
      $scoreGauge.style.backgroundSize = `${Math.min(value / status.getScoreTarget(), 1) * 100}% 100%`
      if (rate < 1) {
        requestAnimationFrame(anime)
      } else {
        resolve()
      }
      audio.counting.play()
    }

    anime()
  })
}

$scoreSuccess.addEventListener('transitionend', () => {
  audio.success.play()
})

app.on('start', () => {
  if (getResult()) {
    const { seed, log } = getResult()
    setRandomSeed(seed)
    app.button.playLog(log)
  } else {
    randomSeed = updateRandomSeed()
    app.button.recLog()
  }
})

app.on('finish', () => {
  const score = status.getAdjustedScore()
  if (app.button.logMode === 'rec') {
    createResult({
      seed: randomSeed, score, log: app.button.log
    }).then(id => {
      pushUrl(id, `￥${score}`)
    })
  }
  app.button.stopLog()
  show()
})
