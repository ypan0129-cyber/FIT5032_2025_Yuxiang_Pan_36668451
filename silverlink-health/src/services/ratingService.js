import {
  doc,
  getDoc,
} from 'firebase/firestore'
import { requireFirebase } from '../firebase'
import { isValidScore, normaliseRatingSummary } from '../utils/rating'
import { createRatingAnalyticsRebuilder, createRatingSaver } from './ratingApi'

const resourceIdPattern = /^[a-z0-9][a-z0-9-]*$/
const ratingApiUrl = import.meta.env.VITE_SUPPORT_PLAN_API_URL?.trim() || ''

function createRatingError(code, message) {
  const error = new Error(message)
  error.code = code
  return error
}

function validateResourceId(resourceId) {
  if (typeof resourceId !== 'string' || !resourceIdPattern.test(resourceId)) {
    throw createRatingError('rating/invalid-resource', 'A valid resource ID is required.')
  }

  return resourceId
}

function getRatingDocument(db, resourceId, uid) {
  return doc(db, 'resources', resourceId, 'ratings', uid)
}

/**
 * Read the server-side aggregate for one resource. No user authentication is
 * required for this read; Firestore rules decide whether the public summary
 * can be viewed.
 */
export async function getRatingSummary(resourceId) {
  const validResourceId = validateResourceId(resourceId)
  const { db } = requireFirebase()
  const aggregateSnapshot = await getDoc(doc(db, 'ratingAnalytics', validResourceId))

  return normaliseRatingSummary(aggregateSnapshot.exists() ? aggregateSnapshot.data() : null)
}

/**
 * Return the currently signed-in user's score, or null when that user has not
 * rated the resource (or when the visitor is not signed in).
 */
export async function getOwnRating(resourceId) {
  const validResourceId = validateResourceId(resourceId)
  const { auth, db } = requireFirebase()

  if (!auth.currentUser) {
    return null
  }

  const snapshot = await getDoc(
    getRatingDocument(db, validResourceId, auth.currentUser.uid),
  )

  if (!snapshot.exists()) {
    return null
  }

  const data = snapshot.data()

  return isValidScore(data.score) ? data.score : null
}

/**
 * Create or replace the signed-in user's rating through the authenticated
 * server endpoint. The server updates the private rating and public aggregate
 * together in a Firestore transaction.
 */
export async function saveOwnRating(resourceId, score) {
  const validResourceId = validateResourceId(resourceId)

  if (!isValidScore(score)) {
    throw createRatingError('rating/invalid-score', 'Choose a rating from 1 to 5.')
  }

  const { auth } = requireFirebase()

  if (!auth.currentUser) {
    throw createRatingError('rating/unauthenticated', 'Sign in to submit a rating.')
  }

  const saveRating = createRatingSaver({
    apiUrl: ratingApiUrl,
    getIdToken: () => auth.currentUser.getIdToken(true),
  })

  return saveRating(validResourceId, score)
}

export async function rebuildRatingAnalytics() {
  const { auth } = requireFirebase()

  if (!auth.currentUser) {
    throw createRatingError('rating/unauthenticated', 'Sign in to rebuild rating analytics.')
  }

  const rebuild = createRatingAnalyticsRebuilder({
    apiUrl: ratingApiUrl,
    getIdToken: () => auth.currentUser.getIdToken(true),
  })

  return rebuild()
}

export function getRatingErrorMessage(error) {
  const messages = {
    'rating/invalid-resource': 'This resource cannot receive a rating.',
    'rating/invalid-score': 'Choose a rating from 1 to 5.',
    'rating/unauthenticated': 'Sign in to submit a rating.',
    'rating/invalid-existing': 'This saved rating is incomplete. Please contact support.',
    'rating/invalid-argument': 'Choose a rating from 1 to 5.',
    'rating/not-configured': 'Ratings are not configured for this environment yet.',
    'rating/permission-denied': 'You do not have permission to complete this rating operation.',
    'rating/unavailable': 'Ratings are temporarily unavailable. Check your connection and try again.',
    'rating/failed-precondition': 'This saved rating is incomplete. Please contact support.',
    'rating/internal': 'We could not save the rating. Please try again.',
    'permission-denied': 'Your rating could not be saved. Please try again.',
    'firestore/permission-denied': 'Your rating could not be saved. Please try again.',
    unavailable: 'Ratings are temporarily unavailable. Check your connection and try again.',
    'failed-precondition': 'Ratings are temporarily unavailable. Please try again later.',
  }

  if (error?.message === 'Firebase is not configured for this environment.') {
    return 'Ratings are not configured for this environment yet.'
  }

  return messages[error?.code] || 'We could not save the rating. Please try again.'
}
