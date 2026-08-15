import test from 'node:test'
import assert from 'node:assert/strict'
import {
  createRatingAnalyticsRebuilder,
  createRatingSaver,
} from '../src/services/ratingApi.js'

function jsonResponse(status, body) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  }
}

test('rating API sends the Firebase token and score to the resource route', async () => {
  let request
  const saveRating = createRatingSaver({
    apiUrl: 'https://ratings.example.test/base/',
    getIdToken: async () => 'firebase-token',
    fetchImplementation: async (url, options) => {
      request = { url: url.toString(), options }
      return jsonResponse(200, { data: { score: 4, isNew: true } })
    },
  })

  const result = await saveRating('beyond-blue', 4)

  assert.equal(request.url, 'https://ratings.example.test/base/ratings/beyond-blue')
  assert.equal(request.options.headers.Authorization, 'Bearer firebase-token')
  assert.deepEqual(JSON.parse(request.options.body), { score: 4 })
  assert.deepEqual(result, { score: 4, isNew: true })
})

test('rating API rejects unsafe configuration and maps server errors', async () => {
  const unsafe = createRatingSaver({
    apiUrl: 'http://ratings.example.test/',
    getIdToken: async () => 'token',
  })
  const denied = createRatingSaver({
    apiUrl: 'https://ratings.example.test/',
    getIdToken: async () => 'token',
    fetchImplementation: async () => jsonResponse(403, {
      error: { code: 'permission-denied', message: 'Only members can rate.' },
    }),
  })

  await assert.rejects(unsafe('beyond-blue', 4), { code: 'rating/not-configured' })
  await assert.rejects(denied('beyond-blue', 4), {
    code: 'rating/permission-denied',
    message: 'Only members can rate.',
  })
})

test('rating API treats network and malformed responses as unavailable', async () => {
  const unreachable = createRatingSaver({
    apiUrl: 'https://ratings.example.test/',
    getIdToken: async () => 'token',
    fetchImplementation: async () => {
      throw new Error('network detail')
    },
  })
  const malformed = createRatingSaver({
    apiUrl: 'https://ratings.example.test/',
    getIdToken: async () => 'token',
    fetchImplementation: async () => ({ ok: true, json: async () => null }),
  })

  await assert.rejects(unreachable('beyond-blue', 4), { code: 'rating/unavailable' })
  await assert.rejects(malformed('beyond-blue', 4), { code: 'rating/unavailable' })
})

test('rating analytics rebuild uses the protected rebuild route', async () => {
  let request
  const rebuild = createRatingAnalyticsRebuilder({
    apiUrl: 'https://ratings.example.test/',
    getIdToken: async () => 'staff-token',
    fetchImplementation: async (url, options) => {
      request = { url: url.toString(), options }
      return jsonResponse(200, { data: { rebuilt: 6 } })
    },
  })

  const result = await rebuild()

  assert.equal(request.url, 'https://ratings.example.test/rating-analytics/rebuild')
  assert.deepEqual(JSON.parse(request.options.body), {})
  assert.deepEqual(result, { rebuilt: 6 })
})
