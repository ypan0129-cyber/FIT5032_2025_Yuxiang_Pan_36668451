import {
  average,
  collection,
  count,
  doc,
  getAggregateFromServer,
  getDoc,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore'
import { requireFirebase } from '../firebase'
import { isValidScore, normaliseRatingSummary } from '../utils/rating'

const resourceIdPattern = /^[a-z0-9][a-z0-9-]*$/

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

function getRatingsCollection(db, resourceId) {
  return collection(db, 'resources', resourceId, 'ratings')
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
  const ratings = getRatingsCollection(db, validResourceId)
  const aggregateSnapshot = await getAggregateFromServer(ratings, {
    average: average('score'),
    count: count(),
  })

  return normaliseRatingSummary(aggregateSnapshot.data())
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
 * Create or replace the signed-in user's rating. The deterministic document
 * ID means one user can have at most one rating per resource. Existing
 * createdAt values are carried forward when a rating is changed.
 */
export async function saveOwnRating(resourceId, score) {
  const validResourceId = validateResourceId(resourceId)

  if (!isValidScore(score)) {
    throw createRatingError('rating/invalid-score', 'Choose a rating from 1 to 5.')
  }

  const { auth, db } = requireFirebase()

  if (!auth.currentUser) {
    throw createRatingError('rating/unauthenticated', 'Sign in to submit a rating.')
  }

  const ratingDocument = getRatingDocument(db, validResourceId, auth.currentUser.uid)
  const existingSnapshot = await getDoc(ratingDocument)
  const hasExistingRating = existingSnapshot.exists()
  const existingData = hasExistingRating ? existingSnapshot.data() : null

  if (hasExistingRating) {
    if (!existingData?.createdAt) {
      throw createRatingError(
        'rating/invalid-existing',
        'This saved rating is incomplete. Please contact support.',
      )
    }

    await setDoc(ratingDocument, {
      score,
      createdAt: existingData.createdAt,
      updatedAt: serverTimestamp(),
    })
  } else {
    await setDoc(ratingDocument, {
      score,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
  }

  return {
    score,
    isNew: !hasExistingRating,
  }
}

export function getRatingErrorMessage(error) {
  const messages = {
    'rating/invalid-resource': 'This resource cannot receive a rating.',
    'rating/invalid-score': 'Choose a rating from 1 to 5.',
    'rating/unauthenticated': 'Sign in to submit a rating.',
    'rating/invalid-existing': 'This saved rating is incomplete. Please contact support.',
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
