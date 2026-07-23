import test from 'node:test'
import assert from 'node:assert/strict'
import {
  calculateRatingSummary,
  isValidScore,
  normaliseRatingSummary,
} from '../src/utils/rating.js'

test('isValidScore accepts only integer scores from 1 to 5', () => {
  assert.deepEqual([1, 2, 3, 4, 5].map(isValidScore), [true, true, true, true, true])
  assert.equal(isValidScore(0), false)
  assert.equal(isValidScore(6), false)
  assert.equal(isValidScore(3.5), false)
  assert.equal(isValidScore('5'), false)
})

test('calculateRatingSummary returns an empty summary without ratings', () => {
  assert.deepEqual(calculateRatingSummary([]), { averageScore: null, ratingCount: 0 })
  assert.deepEqual(calculateRatingSummary(null), { averageScore: null, ratingCount: 0 })
})

test('calculateRatingSummary ignores invalid values and rounds to one decimal', () => {
  assert.deepEqual(calculateRatingSummary([5, 4, 4, 0, 6, '3']), {
    averageScore: 4.3,
    ratingCount: 3,
  })
})

test('normaliseRatingSummary handles aggregate values and empty collections', () => {
  assert.deepEqual(normaliseRatingSummary({ averageScore: 4.666, ratingCount: 3 }), {
    averageScore: 4.7,
    ratingCount: 3,
  })
  assert.deepEqual(normaliseRatingSummary({ average: 3.25, count: 2 }), {
    averageScore: 3.3,
    ratingCount: 2,
  })
  assert.deepEqual(normaliseRatingSummary({ averageScore: null, ratingCount: 0 }), {
    averageScore: null,
    ratingCount: 0,
  })
  assert.deepEqual(normaliseRatingSummary(null), {
    averageScore: null,
    ratingCount: 0,
  })
  assert.deepEqual(normaliseRatingSummary({ averageScore: 5, ratingCount: -2 }), {
    averageScore: null,
    ratingCount: 0,
  })
})
