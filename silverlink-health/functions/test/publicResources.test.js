const test = require('node:test')
const assert = require('node:assert/strict')
const {
  createGetPublicResourceSummaryHandler,
  createListPublicResourcesHandler,
} = require('../src/publicResources')

function createDatabase(aggregate) {
  return {
    collection(name) {
      assert.equal(name, 'ratingAnalytics')

      return {
        doc: (resourceId) => ({
          get: async () => ({
            id: resourceId,
            exists: aggregate !== undefined,
            data: () => aggregate,
          }),
        }),
      }
    },
  }
}

test('public resource listing matches the application directory and returns fresh values', async () => {
  const { resources } = await import('../../src/data/resources.js')
  const listResources = createListPublicResourcesHandler()
  const first = await listResources()

  assert.equal(first.apiVersion, 'v1')
  assert.equal(first.count, 6)
  assert.deepEqual(
    first.resources.map(({ id, title }) => ({ id, title })),
    resources.map(({ id, title }) => ({ id, title })),
  )
  assert.match(first.resources[0].ratingSummaryPath, /^\/api\/v1\/resources\//u)

  first.resources[0].deliveryModes.push('Private mutation')
  const second = await listResources()

  assert.doesNotMatch(JSON.stringify(second), /Private mutation/u)
})

test('public resource listing contains no account or internal rating fields', async () => {
  const result = await createListPublicResourcesHandler()()
  const json = JSON.stringify(result)

  assert.doesNotMatch(
    json,
    /"(?:uid|email|displayName|role|providerMessageId|scoreTotal|scoreDistribution)"/u,
  )
})

test('public rating summary exposes only a privacy-safe aggregate', async () => {
  const getSummary = createGetPublicResourceSummaryHandler({
    db: createDatabase({
      ratingCount: 2,
      scoreTotal: 9,
      averageScore: 4.5,
      scoreDistribution: { 1: 0, 2: 0, 3: 0, 4: 1, 5: 1 },
      privateNote: 'must not leave the server',
    }),
  })

  const result = await getSummary('lifeline-australia')

  assert.deepEqual(result, {
    apiVersion: 'v1',
    resource: {
      id: 'lifeline-australia',
      title: 'Lifeline Australia',
      category: 'Crisis support',
    },
    ratingSummary: {
      averageScore: 4.5,
      ratingCount: 2,
    },
  })
  assert.doesNotMatch(JSON.stringify(result), /privateNote|scoreTotal|scoreDistribution/u)
})

test('public rating summary handles unrated, unknown, and malformed resources safely', async () => {
  const empty = createGetPublicResourceSummaryHandler({ db: createDatabase(undefined) })
  const malformed = createGetPublicResourceSummaryHandler({
    db: createDatabase({
      ratingCount: -1,
      scoreTotal: -5,
      scoreDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    }),
  })

  assert.deepEqual((await empty('beyond-blue')).ratingSummary, {
    averageScore: null,
    ratingCount: 0,
  })
  await assert.rejects(empty('unknown-resource'), { code: 'not-found' })
  await assert.rejects(malformed('beyond-blue'), { code: 'unavailable' })
})
