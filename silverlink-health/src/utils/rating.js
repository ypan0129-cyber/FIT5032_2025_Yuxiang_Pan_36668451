export const MIN_RATING_SCORE = 1
export const MAX_RATING_SCORE = 5

/**
 * Check that a rating is an integer on the five-point scale used by the app.
 * Keeping this check strict also mirrors the Firestore rule for score values.
 */
export function isValidScore(value) {
  return Number.isInteger(value) && value >= MIN_RATING_SCORE && value <= MAX_RATING_SCORE
}

/**
 * Normalise a Firestore aggregate result before it reaches the UI.
 * Firestore returns a null average for an empty collection, while malformed
 * or stale data should never produce an invalid number in the interface.
 */
export function normaliseRatingSummary(summary = {}) {
  // Accept both Firestore aggregate names (`average`/`count`) and the
  // explicit view names used by the components.
  const source = summary && typeof summary === 'object' ? summary : {}
  const averageScore = source.averageScore ?? source.average ?? null
  const ratingCount = source.ratingCount ?? source.count ?? 0
  const safeCount = Number.isFinite(ratingCount) && ratingCount >= 0 ? Math.floor(ratingCount) : 0
  const numericAverage = typeof averageScore === 'number' ? averageScore : null

  if (safeCount === 0 || !Number.isFinite(numericAverage)) {
    return { averageScore: null, ratingCount: safeCount }
  }

  const boundedAverage = Math.min(MAX_RATING_SCORE, Math.max(MIN_RATING_SCORE, numericAverage))
  const roundedAverage = Math.round((boundedAverage + Number.EPSILON) * 10) / 10

  return {
    averageScore: roundedAverage,
    ratingCount: safeCount,
  }
}

/**
 * Calculate a summary from raw scores. Invalid values are ignored so a
 * legacy or corrupted document cannot break the resource detail page.
 */
export function calculateRatingSummary(scores = []) {
  const validScores = Array.isArray(scores) ? scores.filter(isValidScore) : []
  const total = validScores.reduce((sum, score) => sum + score, 0)

  return normaliseRatingSummary({
    averageScore: validScores.length ? total / validScores.length : null,
    ratingCount: validScores.length,
  })
}
