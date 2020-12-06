import { firebase as firebaseConfig } from '../config.js'

firebase.initializeApp(firebaseConfig)
firebase.analytics()

export const db = firebase.firestore()
export const serverTimestamp = firebase.firestore.FieldValue.serverTimestamp()

const providers = {
  'google.com'() {
    const provider = new firebase.auth.GoogleAuthProvider()
    provider.setCustomParameters({ prompt: 'select_account' })
    return provider
  }
}

export function getMe() {
  return firebase.auth().currentUser
}

export function getMeName(providerOnly = false) {
  if (!getMe()) return ''
  const name = providerOnly ? '' : getMe().displayName
  return getMe().providerData.reduce((name, provider) => name || provider.displayName, name) || ''
}

export function getMeProvider(providerId) {
  if (!getMe()) return null
  return getMe().providerData.find(provider => provider.providerId === providerId)
}

export async function signIn(providerId = null) {
  if (!providerId) {
    await firebase.auth().signInAnonymously()
    return
  }

  try {
    await getMe().linkWithPopup(providers[providerId]())
  } catch (err) {
    if (err.code === 'auth/credential-already-in-use') {
      await new Promise(r => setTimeout(r, 3000))
      await firebase.auth().signInWithCredential(err.credential)
      return true
    } else {
      throw err
    }
  }
}

export async function signOut() {
  await firebase.auth().signOut()
}

export function onAuthStateChanged(listener) {
  firebase.auth().onAuthStateChanged(listener)
}
