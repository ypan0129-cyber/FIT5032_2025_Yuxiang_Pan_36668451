import { readonly, reactive } from 'vue'
import {
  browserLocalPersistence,
  createUserWithEmailAndPassword,
  deleteUser,
  onAuthStateChanged,
  setPersistence,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  updateProfile,
} from 'firebase/auth'
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore'
import { isFirebaseConfigured, requireFirebase } from './firebase'
import { normaliseDisplayName } from './utils/authValidation'

const state = reactive({
  user: null,
  profile: null,
  ready: false,
  profileError: '',
})

let initialisePromise

async function loadProfile(user, db) {
  const snapshot = await getDoc(doc(db, 'users', user.uid))
  state.profile = snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } : null
  state.profileError = snapshot.exists()
    ? ''
    : 'Your account profile could not be found. Please contact support.'
}

export function initialiseAuth() {
  if (initialisePromise) {
    return initialisePromise
  }

  if (!isFirebaseConfigured) {
    state.ready = true
    initialisePromise = Promise.resolve()
    return initialisePromise
  }

  const { auth, db } = requireFirebase()

  initialisePromise = new Promise((resolve) => {
    let isFirstResult = true

    setPersistence(auth, browserLocalPersistence).catch(() => {
      state.profileError = 'This browser could not keep you signed in.'
    })

    onAuthStateChanged(
      auth,
      async (user) => {
        state.user = user
        state.profile = null

        if (user) {
          try {
            await loadProfile(user, db)
          } catch {
            state.profileError = 'Your profile could not be loaded. Please try again.'
          }
        } else {
          state.profileError = ''
        }

        state.ready = true

        if (isFirstResult) {
          isFirstResult = false
          resolve()
        }
      },
      () => {
        state.ready = true
        state.profileError = 'Your sign-in status could not be checked. Please refresh the page.'

        if (isFirstResult) {
          isFirstResult = false
          resolve()
        }
      },
    )
  })

  return initialisePromise
}

export async function registerMember({ displayName, email, password }) {
  const { auth, db } = requireFirebase()
  const normalisedName = normaliseDisplayName(displayName)
  let createdUser

  try {
    const credential = await createUserWithEmailAndPassword(auth, email.trim(), password)
    createdUser = credential.user

    await updateProfile(createdUser, { displayName: normalisedName })
    await setDoc(doc(db, 'users', createdUser.uid), {
      displayName: normalisedName,
      role: 'member',
      createdAt: serverTimestamp(),
    })

    state.user = createdUser
    state.profile = {
      id: createdUser.uid,
      displayName: normalisedName,
      role: 'member',
    }
    state.profileError = ''

    return createdUser
  } catch (error) {
    if (createdUser) {
      try {
        await deleteUser(createdUser)
      } catch {
        // A later login can recover the account if Firebase cannot roll it back.
      }
    }

    throw error
  }
}

export async function signIn(email, password) {
  const { auth, db } = requireFirebase()
  const credential = await signInWithEmailAndPassword(auth, email.trim(), password)

  state.user = credential.user
  await loadProfile(credential.user, db)

  return credential.user
}

export async function signOut() {
  const { auth } = requireFirebase()
  await firebaseSignOut(auth)
  state.user = null
  state.profile = null
  state.profileError = ''
}

export function getAuthErrorMessage(error) {
  const messages = {
    'auth/email-already-in-use': 'An account already uses this email address.',
    'auth/invalid-credential': 'The email address or password is incorrect.',
    'auth/invalid-email': 'Enter a valid email address.',
    'auth/network-request-failed': 'The network request failed. Check your connection and try again.',
    'auth/operation-not-allowed': 'Email and password sign-in is not enabled yet.',
    'auth/too-many-requests': 'Too many attempts were made. Please wait before trying again.',
    'auth/user-disabled': 'This account has been disabled. Please contact support.',
    'auth/weak-password': 'Choose a stronger password with at least 8 characters.',
    'permission-denied': 'Your account profile could not be created. Please contact support.',
    'firestore/permission-denied': 'Your account profile could not be created. Please contact support.',
  }

  if (error?.message === 'Firebase is not configured for this environment.') {
    return 'Account access is not configured. Add the Firebase environment settings and try again.'
  }

  return messages[error?.code] || 'Something went wrong. Please try again.'
}

export function useAuth() {
  return readonly(state)
}
