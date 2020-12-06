import { $, div, toDelimited } from '../lib/util.js'
import { getMe, getMeName, getMeProvider, signIn, signOut, onAuthStateChanged, db, serverTimestamp } from '../lib/firebase.js'
import * as audio from '../audio/audio.js'

export const version = '0'
export const defaultName = 'no name'

const $reset = $('.information .reset')
const $share = $('.information .share')
const $sound = $('.information .sound')
const $soundFull = $('.information .sound .icon.full')
const $soundMute = $('.information .sound .icon.mute')

let currentResultId = ''

$sound.addEventListener('click', () => {
  audio.setMute(!audio.isMute())
})

audio.onChangeMute(() => {
  $soundFull.classList.toggle('show', !audio.isMute())
  $soundMute.classList.toggle('show', audio.isMute())
})

$reset.addEventListener('click', () => {
  clearResultUrl()
  window.dispatchEvent(new PopStateEvent('popstate', { state: window.history.state }))
})

export function hasResultUrl() {
  return !!currentResultId
}

function clearResultUrl() {
  if (hasResultUrl()) {
    const url = new URL(location.href)
    url.searchParams.delete('r')
    history.pushState(null, '', url.href)
    updateUrl()
  }
}

export function pushUrl(resultId, text = '') {
  const url = new URL(location.href)
  url.searchParams.set('r', resultId)
  history.pushState({ tweetText: text }, '', url.href)
  updateUrl()
}

function updateUrl() {
  currentResultId = new URLSearchParams(location.search).get('r')

  $share.href = 'https://twitter.com/share?' + new URLSearchParams({
    text: history.state && history.state.tweetText || '',
    url: location.href,
    hashtags: 'firerunnersan',
  })
}

const $entryList = $('.leaderboard .entry-list')
const $entryListLoading = $('.leaderboard .loading')
let currentEntries = []

function fetchEntries() {
  db.collection('entries')
    .where('version', '==', version)
    .orderBy('score', 'desc')
    .limit(100)
    .onSnapshot(snap => {
      $entryListLoading.classList.remove('show')
      currentEntries = snap.docs.map(doc => ({ ...doc.data(), id: doc.id }))
      updateEntryList()
    })
}

async function updateEntryList() {
  $entryList.innerHTML = ''

  for (const entry of currentEntries) {
    const onclick = () => {
      pushUrl(entry.resultId)
      window.dispatchEvent(new PopStateEvent('popstate', { state: window.history.state }))
    }
    const isMe = (getMe() && getMe().uid === entry.uid)
    const $entry = div(`.entry${isMe ? '.me' : ''}`, {}, [
      div('.name', {}, entry.name || defaultName),
      div('.score', {}, `￥${toDelimited(entry.score)}`),
      div('.play.clickable', { onclick }, '▶'),
    ])
    $entryList.appendChild($entry)
  }
}

function getMeEntry() {
  return currentEntries.find(e => e.uid === getMe().uid)
}

let currentResult = null
let fetchResultState = {}

export async function createResult(result) {
  const batch = db.batch()
  const resultId = db.collection('results').doc().id
  const entry = getMeEntry()

  batch.set(db.collection('results').doc(resultId), {
    version,
    uid: getMe().uid,
    name: getMeName(),
    registeredAt: serverTimestamp,
    score: result.score,
    seed: result.seed,
    log: result.log,
  })

  if (!entry) {
    batch.set(db.collection('entries').doc(), {
      version,
      uid: getMe().uid,
      name: getMeName(),
      registeredAt: serverTimestamp,
      score: result.score,
      resultId,
    })
  } else if (entry.score < result.score) {
    batch.update(db.collection('entries').doc(entry.id), {
      registeredAt: serverTimestamp,
      score: result.score,
      resultId,
    })
  }

  await batch.commit()

  currentResultId = resultId
  currentResult = result

  return currentResultId
}

export function getResult() {
  return currentResult
}

export function clearResult() {
  currentResult = null
  fetchResultState = { done: true }
  clearResultUrl()
}

export function isFetchingResult() {
  return !fetchResultState.done
}

export async function fetchResult() {
  if (!currentResultId) {
    currentResult = null
    fetchResultState = { done: true }
    return
  }

  if (fetchResultState.id === currentResultId) {
    return
  }

  currentResult = null
  const state = fetchResultState = { id: currentResultId }
  const doc = await db.collection('results').doc(currentResultId).get().catch(() => null)
  state.done = true

  if (doc && doc.exists && state === fetchResultState) {
    const result = doc.data()
    if (result.version === version) {
      currentResult = result
    }
  }
}

const $user = $('.leaderboard .user')
const $userIconDefault = $('.leaderboard .user .icon.default')
const $userIconGoogle = $('.leaderboard .user .icon.google')

const $userSettings = $('.user-settings')
const $userSettingsClose = $('.user-settings .close')
const $userSettingsLoading = $('.user-settings .loading')
const $nameForm = $('.user-settings .form')
const $nameText = $('.user-settings .text')
const $nameApply = $('.user-settings .apply')
const $googleAuth = $('.user-settings .external-auth')
const $googleAuthLabel = $('.user-settings .external-auth .label')

function updateSettingsState() {
  const googleProvider = getMeProvider('google.com')
  $userIconDefault.classList.toggle('active', !googleProvider)
  $userIconGoogle.classList.toggle('active', !!googleProvider)
  $googleAuthLabel.textContent = googleProvider ? googleProvider.email : 'Sign in with Google'
  $googleAuth.classList.toggle('disabled', !getMe())
  $nameText.placeholder = getMeName(true) || defaultName
  $nameApply.disabled = !getMe() || ($nameText.value === (getMe().displayName || ''))
}

async function setUserName(name) {
  const entry = getMeEntry()
  if (entry) {
    const batch = db.batch()
    batch.update(db.collection('entries').doc(entry.id), { name })
    batch.update(db.collection('results').doc(entry.resultId), { name })
    await batch.commit()
  }
}

$user.addEventListener('click', () => {
  $nameText.value = getMe().displayName || ''
  updateSettingsState()
  $userSettings.classList.add('show')
})

$userSettingsClose.addEventListener('click', () => {
  $userSettings.classList.remove('show')
})

$nameForm.addEventListener('submit', async (e) => {
  e.preventDefault()

  $userSettingsLoading.classList.add('show')
  try {
    const oldName = getMeName()

    await getMe().updateProfile({
      displayName: $nameText.value
    })
    updateSettingsState()

    const newName = getMeName()
    if (oldName !== newName) {
      setUserName(newName)
    }
  } finally {
    $userSettingsLoading.classList.remove('show')
  }
})

$nameText.addEventListener('input', () => {
  $nameApply.disabled = $nameText.value === (getMe().displayName || '')
})

$googleAuth.addEventListener('click', async () => {
  $userSettingsLoading.classList.add('show')
  try {
    if (getMeProvider('google.com')) {
      await signOut()
      await signIn()
      return
    }

    const oldName = getMeName()

    if (await signIn('google.com')) return

    const newName = getMeName()
    if (oldName !== newName) {
      setUserName(newName)
    }
  } finally {
    $userSettingsLoading.classList.remove('show')
  }
})

new Promise(r => onAuthStateChanged(r)).then(() => {
  !getMe() && signIn()
})
onAuthStateChanged(() => {
  $nameText.value = getMe() && getMe().displayName || ''
  updateEntryList()
  updateSettingsState()
})
window.addEventListener('popstate', () => {
  updateUrl()
  fetchResult()
})
updateUrl()
fetchResult()
fetchEntries()
