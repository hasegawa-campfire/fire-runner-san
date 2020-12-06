import * as app from '../app/app.js'
import * as status from '../status/status.js'
import { $, toDelimited } from '../lib/util.js'
import { hasResultUrl, isFetchingResult, getResult, defaultName } from '../leaderboard/leaderboard.js'
import * as audio from '../audio/audio.js'

const $launchDefault = $('.launch.default')
const $launchReplay = $('.launch.replay')
const $replayName = $('.launch.replay .name')
const $replayScore = $('.launch.replay .score')
const $replayScoreValue = $('.launch.replay .score .value')
const $replayError = $('.launch.replay .error')
const $replayLoading = $('.launch.replay .loading')

const messages = [
  '駆け抜けて\nめざせ￥1,000,000',
  '♥を集めて\nスピードアップ',
  '勢いがあるほど\n加点もアップ',
  '目標達成で\nリミッター解除',
  'ボタンの長押しや\n二度押しで滑空',
  '結果表示の間は\nリプレイのシェアになる',
  'ランキングで\nリプレイを再生',
  'ページのどこを押しても\nジャンプ！',
]

let isActive = false
let isShownReplay = false

export function init() {
  const count = +sessionStorage.getItem('launch-count') || 0
  sessionStorage.setItem('launch-count', count + 1)

  $launchDefault.textContent = messages[count % messages.length]
  $launchDefault.classList.toggle('show', !hasResultUrl())
  $launchReplay.classList.toggle('show', hasResultUrl())
  $launchReplay.dataset.bottom = ''
  $replayError.classList.remove('show')
  $replayName.classList.remove('show')
  $replayScore.classList.remove('show')
  $replayName.textContent = ''
  $replayScoreValue.textContent = ''
  $replayLoading.classList.toggle('show', hasResultUrl())
  isActive = true
  isShownReplay = false
}

export function update() {
  if (hasResultUrl()) {
    if (isFetchingResult()) return
    if (!isShownReplay) {
      if (getResult()) {
        $replayName.classList.add('show')
        $replayScore.classList.add('show')
        $replayName.textContent = getResult().name || defaultName
        $replayScoreValue.textContent = toDelimited(getResult().score)
        $launchReplay.dataset.bottom = 'PRESS ANY BUTTON'
        $replayLoading.classList.remove('show')
      } else {
        $replayError.classList.add('show')
        $launchReplay.dataset.bottom = 'ERROR'
      }
      isShownReplay = true
    }
  }

  if (isActive && app.button.isUpChanged) {
    app.start()
    audio.start.play()
  }
}

app.on('start', () => {
  isActive = false
  $launchDefault.classList.remove('show')
  $launchReplay.classList.remove('show')
})
