const test = require('node:test')
const assert = require('node:assert/strict')
const {
  RESOURCE_IDS,
  buildAggregate,
  createRebuildRatingAnalyticsHandler,
  createSaveRatingHandler,
  validateRatingPayload,
} = require('../src/ratingAnalytics')

function snapshot(data) {
  return {
    exists: data !== undefined,
    data: () => data,
  }
}

function createDatabase({ role = 'member', ratings = {}, aggregates = {} } = {}) {
  const state = {
    profiles: { 'user-1': { role } },
    ratings: structuredClone(ratings),
    aggregates: structuredClone(aggregates),
  }

  function documentReference(path) {
    return { kind: 'document', path }
  }

  function collectionReference(path) {
    return {
      kind: 'collection',
      path,
      doc: (id) => documentReference(`${path}/${id}`),
    }
  }

  function readDocument(path) {
    const parts = path.split('/')

    if (parts[0] === 'users') {
      return snapshot(state.profiles[parts[1]])
    }

    if (parts[0] === 'ratingAnalytics') {
      return snapshot(state.aggregates[parts[1]])
    }

    return snapshot(state.ratings[parts[1]]?.[parts[3]])
  }

  function writeDocument(path, data) {
    const parts = path.split('/')

    if (parts[0] === 'ratingAnalytics') {
      state.aggregates[parts[1]] = structuredClone(data)
      return
    }

    state.ratings[parts[1]] ||= {}
    state.ratings[parts[1]][parts[3]] = structuredClone(data)
  }

  const db = {
    collection(name) {
      if (name === 'resources') {
        return {
          doc: (resourceId) => ({
            collection: (subcollection) =>
              collectionReference(`resources/${resourceId}/${subcollection}`),
          }),
        }
      }

      const reference = collectionReference(name)
      const originalDoc = reference.doc
      reference.doc = (id) => {
        const document = originalDoc(id)
        document.get = async () => readDocument(document.path)
        return document
      }
      return reference
    },
    async runTransaction(callback) {
      return callback({
        get: async (reference) => {
          if (reference.kind === 'collection') {
            const resourceId = reference.path.split('/')[1]
            return {
              docs: Object.values(state.ratings[resourceId] || {}).map((rating) => snapshot(rating)),
            }
          }

          return readDocument(reference.path)
        },
        set: (reference, data) => writeDocument(reference.path, data),
      })
    },
  }

  return { db, state }
}

test('rating payload validation accepts only known resources and integer scores', () => {
  assert.deepEqual(
    validateRatingPayload({ resourceId: RESOURCE_IDS[0], score: 5 }),
    { resourceId: RESOURCE_IDS[0], score: 5 },
  )
  assert.throws(
    () => validateRatingPayload({ resourceId: 'unknown-service', score: 5 }),
    /cannot receive a rating/u,
  )
  assert.throws(
    () => validateRatingPayload({ resourceId: RESOURCE_IDS[0], score: 4.5 }),
    /from 1 to 5/u,
  )
  assert.throws(
    () => validateRatingPayload({ resourceId: RESOURCE_IDS[0], score: 4, uid: 'forged' }),
    /unsupported fields/u,
  )
})

test('aggregate builder ignores malformed legacy scores', () => {
  const result = buildAggregate([
    snapshot({ score: 5 }),
    snapshot({ score: 3 }),
    snapshot({ score: '4' }),
  ])

  assert.deepEqual(result, {
    ratingCount: 2,
    scoreTotal: 8,
    averageScore: 4,
    scoreDistribution: { 1: 0, 2: 0, 3: 1, 4: 0, 5: 1 },
  })
})

test('saving a new rating creates a private record and aggregate in one transaction', async () => {
  const { db, state } = createDatabase()
  const handler = createSaveRatingHandler({ db, createTimestamp: () => 'timestamp-1' })
  const result = await handler({
    auth: { uid: 'user-1' },
    data: { resourceId: RESOURCE_IDS[0], score: 5 },
  })

  assert.equal(result.isNew, true)
  assert.deepEqual(result.summary, {
    averageScore: 5,
    ratingCount: 1,
    scoreDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 1 },
  })
  assert.deepEqual(state.ratings[RESOURCE_IDS[0]]['user-1'], {
    score: 5,
    createdAt: 'timestamp-1',
    updatedAt: 'timestamp-1',
  })
})

test('updating a rating preserves its creation time and does not increase the count', async () => {
  const resourceId = RESOURCE_IDS[0]
  const { db, state } = createDatabase({
    ratings: {
      [resourceId]: {
        'user-1': { score: 2, createdAt: 'original', updatedAt: 'old' },
        'user-2': { score: 4, createdAt: 'other', updatedAt: 'old' },
      },
    },
    aggregates: {
      [resourceId]: {
        ratingCount: 2,
        scoreTotal: 6,
        averageScore: 3,
        scoreDistribution: { 1: 0, 2: 1, 3: 0, 4: 1, 5: 0 },
      },
    },
  })
  const handler = createSaveRatingHandler({ db, createTimestamp: () => 'timestamp-2' })
  const result = await handler({
    auth: { uid: 'user-1' },
    data: { resourceId, score: 5 },
  })

  assert.equal(result.isNew, false)
  assert.equal(result.summary.ratingCount, 2)
  assert.equal(result.summary.averageScore, 4.5)
  assert.deepEqual(result.summary.scoreDistribution, { 1: 0, 2: 0, 3: 0, 4: 1, 5: 1 })
  assert.equal(state.ratings[resourceId]['user-1'].createdAt, 'original')
})

test('rating writes and analytics rebuild enforce member and staff roles', async () => {
  const memberDatabase = createDatabase({ role: 'staff' }).db
  const staffDatabase = createDatabase({ role: 'member' }).db
  const saveRating = createSaveRatingHandler({
    db: memberDatabase,
    createTimestamp: () => 'timestamp',
  })
  const rebuild = createRebuildRatingAnalyticsHandler({
    db: staffDatabase,
    createTimestamp: () => 'timestamp',
  })

  await assert.rejects(
    saveRating({ auth: { uid: 'user-1' }, data: { resourceId: RESOURCE_IDS[0], score: 3 } }),
    /Only member accounts/u,
  )
  await assert.rejects(
    rebuild({ auth: { uid: 'user-1' }, data: {} }),
    /Only staff accounts/u,
  )
})

test('staff rebuild creates aggregate documents for every supported resource', async () => {
  const resourceId = RESOURCE_IDS[1]
  const { db, state } = createDatabase({
    role: 'staff',
    ratings: {
      [resourceId]: {
        first: { score: 3 },
        second: { score: 5 },
      },
    },
  })
  const rebuild = createRebuildRatingAnalyticsHandler({
    db,
    createTimestamp: () => 'rebuilt-at',
  })
  const result = await rebuild({ auth: { uid: 'user-1' }, data: {} })

  assert.equal(result.rebuilt, RESOURCE_IDS.length)
  assert.equal(state.aggregates[resourceId].ratingCount, 2)
  assert.equal(state.aggregates[resourceId].averageScore, 4)
  assert.equal(Object.keys(state.aggregates).length, RESOURCE_IDS.length)
})
