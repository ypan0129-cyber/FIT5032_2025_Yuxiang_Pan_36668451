import test from 'node:test'
import assert from 'node:assert/strict'
import { createAdminMetricsLoader, normaliseAdminMetrics } from '../src/services/adminApi.js'

const validMetrics = {
  generatedAt: '2026-08-15T03:00:00.000Z',
  users: {
    total: 4,
    roles: { member: 2, staff: 1, admin: 1, other: 0 },
  },
  ratings: {
    totalRatings: 3,
    ratedResources: 2,
    resourceCount: 6,
    averageScore: 4,
  },
  emails: {
    attemptsToday: 2,
    trackedAccounts: 2,
    latestStatuses: { sent: 1, failed: 1, pending: 0, other: 0 },
  },
}

function jsonResponse(status, body) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  }
}

test('administrator API sends a Firebase token to the protected metrics route', async () => {
  let request
  const load = createAdminMetricsLoader({
    apiUrl: 'https://api.example.test/base/',
    getIdToken: async () => 'admin-token',
    fetchImplementation: async (url, options) => {
      request = { url: url.toString(), options }
      return jsonResponse(200, { data: validMetrics })
    },
  })

  const result = await load()

  assert.equal(request.url, 'https://api.example.test/base/admin/metrics')
  assert.equal(request.options.credentials, 'omit')
  assert.equal(request.options.headers.Authorization, 'Bearer admin-token')
  assert.deepEqual(JSON.parse(request.options.body), {})
  assert.deepEqual(result, validMetrics)
})

test('administrator API rejects unsafe endpoints and missing identity tokens', async () => {
  const unsafe = createAdminMetricsLoader({
    apiUrl: 'http://api.example.test/',
    getIdToken: async () => 'token',
  })
  const missingToken = createAdminMetricsLoader({
    apiUrl: 'https://api.example.test/',
    getIdToken: async () => '',
  })
  const rejectedToken = createAdminMetricsLoader({
    apiUrl: 'https://api.example.test/',
    getIdToken: async () => {
      throw new Error('private Firebase detail')
    },
  })

  await assert.rejects(unsafe(), { code: 'admin/not-configured' })
  await assert.rejects(missingToken(), { code: 'admin/unauthenticated' })
  await assert.rejects(rejectedToken(), { code: 'admin/unauthenticated' })
})

test('administrator API maps permission, network and malformed response failures', async () => {
  const denied = createAdminMetricsLoader({
    apiUrl: 'https://api.example.test/',
    getIdToken: async () => 'member-token',
    fetchImplementation: async () => jsonResponse(403, {
      error: { code: 'permission-denied', message: 'Administrator access required.' },
    }),
  })
  const unavailable = createAdminMetricsLoader({
    apiUrl: 'https://api.example.test/',
    getIdToken: async () => 'admin-token',
    fetchImplementation: async () => {
      throw new Error('network detail')
    },
  })
  const malformed = createAdminMetricsLoader({
    apiUrl: 'https://api.example.test/',
    getIdToken: async () => 'admin-token',
    fetchImplementation: async () => jsonResponse(200, { data: { users: {} } }),
  })

  await assert.rejects(denied(), {
    code: 'admin/permission-denied',
    message: 'Administrator access required.',
  })
  await assert.rejects(unavailable(), { code: 'admin/unavailable' })
  await assert.rejects(malformed(), { code: 'admin/unavailable' })
})

test('administrator API validates counts and strips unexpected response fields', () => {
  const withPrivateFields = structuredClone(validMetrics)
  withPrivateFields.users.records = [{ uid: 'private-uid', email: 'private@example.test' }]
  withPrivateFields.providerMessageId = 'private-message-id'

  assert.deepEqual(normaliseAdminMetrics(withPrivateFields), validMetrics)
  assert.throws(
    () => normaliseAdminMetrics({
      ...validMetrics,
      users: { ...validMetrics.users, total: -1 },
    }),
    { code: 'admin/unavailable' },
  )
  assert.throws(
    () => normaliseAdminMetrics({
      ...validMetrics,
      ratings: { ...validMetrics.ratings, averageScore: Number.NaN },
    }),
    { code: 'admin/unavailable' },
  )
})
