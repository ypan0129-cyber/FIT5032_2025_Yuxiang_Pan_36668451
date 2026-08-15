const test = require('node:test')
const assert = require('node:assert/strict')
const { createAdminMetricsHandler } = require('../src/adminMetrics')

function snapshot(data, id) {
  return {
    id,
    exists: data !== undefined,
    data: () => data,
  }
}

function createDatabase({ role = 'admin', users = [], ratings = [], emails = [] } = {}) {
  const collections = { users, ratingAnalytics: ratings, emailDispatches: emails }

  return {
    collection(name) {
      return {
        doc: () => ({ get: async () => snapshot(role ? { role } : undefined) }),
        select() {
          return {
            get: async () => ({
              docs: (collections[name] || []).map((document) =>
                snapshot(document.data, document.id)),
            }),
          }
        },
      }
    },
  }
}

function validRating(id, ratingCount, scoreTotal, distribution) {
  return {
    id,
    data: {
      ratingCount,
      scoreTotal,
      scoreDistribution: distribution,
    },
  }
}

test('administrator metrics require authentication and the admin role', async () => {
  const missingAuth = createAdminMetricsHandler({ db: createDatabase() })
  const member = createAdminMetricsHandler({ db: createDatabase({ role: 'member' }) })
  const staff = createAdminMetricsHandler({ db: createDatabase({ role: 'staff' }) })

  await assert.rejects(missingAuth({ auth: null, data: {} }), { code: 'unauthenticated' })
  await assert.rejects(member({ auth: { uid: 'member-1' }, data: {} }), {
    code: 'permission-denied',
  })
  await assert.rejects(staff({ auth: { uid: 'staff-1' }, data: {} }), {
    code: 'permission-denied',
  })
})

test('administrator metrics aggregate roles, ratings and current-day email attempts', async () => {
  const db = createDatabase({
    users: [
      { id: 'member-1', data: { role: 'member', email: 'private@example.test' } },
      { id: 'staff-1', data: { role: 'staff' } },
      { id: 'admin-1', data: { role: 'admin' } },
      { id: 'legacy-1', data: { role: 'legacy' } },
    ],
    ratings: [
      validRating('lifeline-australia', 2, 9, { 1: 0, 2: 0, 3: 0, 4: 1, 5: 1 }),
      validRating('beyond-blue', 1, 3, { 1: 0, 2: 0, 3: 1, 4: 0, 5: 0 }),
      validRating('unknown-resource', 100, 500, { 1: 0, 2: 0, 3: 0, 4: 0, 5: 100 }),
    ],
    emails: [
      { id: 'member-1', data: { dayKey: '2026-08-15', dailyCount: 2, lastStatus: 'sent' } },
      { id: 'member-2', data: { dayKey: '2026-08-14', dailyCount: 4, lastStatus: 'failed' } },
      { id: 'member-3', data: { dayKey: '2026-08-15', dailyCount: 1, lastStatus: 'pending' } },
    ],
  })
  const handler = createAdminMetricsHandler({
    db,
    now: () => new Date('2026-08-15T03:00:00.000Z'),
  })

  const result = await handler({ auth: { uid: 'admin-1' }, data: {} })

  assert.deepEqual(result, {
    generatedAt: '2026-08-15T03:00:00.000Z',
    users: {
      total: 4,
      roles: { member: 1, staff: 1, admin: 1, other: 1 },
    },
    ratings: {
      totalRatings: 3,
      ratedResources: 2,
      resourceCount: 6,
      averageScore: 4,
    },
    emails: {
      attemptsToday: 3,
      trackedAccounts: 3,
      latestStatuses: { sent: 1, failed: 1, pending: 1, other: 0 },
    },
  })
  assert.doesNotMatch(JSON.stringify(result), /member-1|private@example|providerMessageId/u)
})

test('administrator metrics ignore malformed aggregate and counter values', async () => {
  const db = createDatabase({
    users: [{ id: 'broken', data: null }],
    ratings: [
      validRating('lifeline-australia', -2, -10, { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }),
      validRating('beyond-blue', 2, 40, { 1: 0, 2: 0, 3: 0, 4: 0, 5: 2 }),
    ],
    emails: [
      { id: 'broken', data: { dayKey: '2026-08-15', dailyCount: -8, lastStatus: 'unexpected' } },
    ],
  })
  const handler = createAdminMetricsHandler({
    db,
    now: () => new Date('2026-08-15T00:00:00.000Z'),
  })

  const result = await handler({ auth: { uid: 'admin-1' }, data: {} })

  assert.deepEqual(result.users, {
    total: 1,
    roles: { member: 0, staff: 0, admin: 0, other: 1 },
  })
  assert.deepEqual(result.ratings, {
    totalRatings: 0,
    ratedResources: 0,
    resourceCount: 6,
    averageScore: null,
  })
  assert.deepEqual(result.emails, {
    attemptsToday: 0,
    trackedAccounts: 1,
    latestStatuses: { sent: 0, failed: 0, pending: 0, other: 1 },
  })
})

test('administrator metrics reject unexpected request fields', async () => {
  const handler = createAdminMetricsHandler({ db: createDatabase() })

  await assert.rejects(
    handler({ auth: { uid: 'admin-1' }, data: { includeUsers: true } }),
    { code: 'invalid-argument' },
  )
})
