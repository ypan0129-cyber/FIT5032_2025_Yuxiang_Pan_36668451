import { readonly, reactive } from 'vue'
import {
  browserLocalPersistence,
  createUserWithEmailAndPassword,
  deleteUser,
  GoogleAuthProvider,
  onAuthStateChanged,
  reload,
  setPersistence,
  sendEmailVerification,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut as firebaseSignOut,
  updateProfile,
} from 'firebase/auth'
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore'
import { isFirebaseConfigured, requireFirebase } from './firebase'
import { normaliseDisplayName } from './utils/authValidation'
import { createProviderMemberProfile } from './utils/providerProfile'

const state = reactive({
  user: null,
  profile: null,
  ready: false,
  profileError: '',
})

let initialisePromise
const googleProvider = new GoogleAuthProvider()

googleProvider.setCustomParameters({ prompt: 'select_account' })

async function loadProfile(user, db) {
  const snapshot = await getDoc(doc(db, 'users', user.uid))
  state.profile = snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } : null
  state.profileError = snapshot.exists()
    ? ''
    : 'Your account profile could not be found. Please contact support.'
}

async function loadOrCreateProviderProfile(user, db) {
  const profileReference = doc(db, 'users', user.uid)
  const snapshot = await getDoc(profileReference)

  if (snapshot.exists()) {
    state.profile = { id: snapshot.id, ...snapshot.data() }
    state.profileError = ''
    return state.profile
  }

  const profile = createProviderMemberProfile(user, serverTimestamp())
  await setDoc(profileReference, profile)

  state.profile = {
    id: user.uid,
    displayName: profile.displayName,
    role: profile.role,
  }
  state.profileError = ''

  return state.profile
}

export async function refreshProfile() {
  if (!state.user) {
    state.profile = null
    state.profileError = ''
    return null
  }

  const { db } = requireFirebase()

  try {
    await loadProfile(state.user, db)
    return state.profile
  } catch {
    state.profile = null
    state.profileError = 'Your profile could not be loaded. Please try again.'
    return null
  }
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

export async function signInWithGoogle() {
  const { auth, db } = requireFirebase()
  let signedInUser

  try {
    const credential = await signInWithPopup(auth, googleProvider)
    signedInUser = credential.user
    state.user = signedInUser
    await loadOrCreateProviderProfile(signedInUser, db)

    return signedInUser
  } catch (error) {
    if (signedInUser) {
      try {
        await firebaseSignOut(auth)
      } catch {
        // Keep the original profile error so the failed sign-in remains diagnosable.
      }

      state.user = null
      state.profile = null
      state.profileError = ''
    }

    throw error
  }
}

export async function signOut() {
  const { auth } = requireFirebase()
  await firebaseSignOut(auth)
  state.user = null
  state.profile = null
  state.profileError = ''
}

export async function sendAccountVerificationEmail() {
  const { auth } = requireFirebase()

  if (!auth.currentUser) {
    throw new Error('No signed-in account is available.')
  }

  await sendEmailVerification(auth.currentUser)
}

export async function refreshCurrentUser() {
  const { auth } = requireFirebase()

  if (!auth.currentUser) {
    return null
  }

  await reload(auth.currentUser)
  await auth.currentUser.getIdToken(true)
  state.user = auth.currentUser
  return state.user
}

export function getAuthErrorMessage(error) {
  const messages = {
    'auth/email-already-in-use': 'An account already uses this email address.',
    'auth/account-exists-with-different-credential':
      'This email already uses another sign-in method. Log in with that method first.',
    'auth/cancelled-popup-request': 'The Google sign-in request was cancelled.',
    'auth/invalid-credential': 'The email address or password is incorrect.',
    'auth/invalid-email': 'Enter a valid email address.',
    'auth/network-request-failed': 'The network request failed. Check your connection and try again.',
    'auth/operation-not-allowed': 'This sign-in method is not enabled yet.',
    'auth/operation-not-supported-in-this-environment':
      'Google sign-in is not supported in this browser environment.',
    'auth/requires-recent-login': 'Sign in again before changing this account setting.',
    'auth/popup-blocked': 'The Google sign-in window was blocked. Allow pop-ups and try again.',
    'auth/popup-closed-by-user': 'Google sign-in was closed before it finished.',
    'auth/too-many-requests': 'Too many attempts were made. Please wait before trying again.',
    'auth/unauthorized-domain': 'This website is not authorised for Google sign-in.',
    'auth/user-disabled': 'This account has been disabled. Please contact support.',
    'auth/weak-password': 'Choose a stronger password with at least 8 characters.',
    'permission-denied': 'Your account profile could not be created. Please contact support.',
    'firestore/permission-denied': 'Your account profile could not be created. Please contact support.',
    'functions/failed-precondition': 'Verify your email address before sending a support plan.',
    'functions/invalid-argument': 'Check the support plan fields and try again.',
    'functions/permission-denied': 'This account cannot send a support plan.',
    'functions/resource-exhausted': 'Please wait before sending another support plan email.',
    'functions/unavailable': 'The email service is temporarily unavailable. Try again later.',
    'functions/internal': 'The support plan could not be sent. Try again later.',
  }

  if (error?.message === 'Firebase is not configured for this environment.') {
    return 'Account access is not configured. Add the Firebase environment settings and try again.'
  }

  return messages[error?.code] || 'Something went wrong. Please try again.'
}

export function useAuth() {
  return readonly(state)
}
