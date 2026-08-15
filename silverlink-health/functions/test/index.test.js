const test = require('node:test')
const assert = require('node:assert/strict')
const {
  createSupportPlanHttpHandler,
  getServiceAccount,
} = require('../src/index')

const allowedOrigin = 'http://localhost:5173'
const validPayload = {
  resourceIds: ['lifeline-australia'],
  contactPreference: 'Phone',
  notes: '',
}

function createEvent({
  method = 'POST',
  origin = allowedOrigin,
  authorization = 'Bearer valid-token',
  body = validPayload,
  path = '/',
} = {}) {
  return {
    requestContext: { http: { method, path } },
    headers: {
      authorization,
      origin,
    },
    body: JSON.stringify(body),
    isBase64Encoded: false,
  }
}

function createHandler(overrides = {}) {
  return createSupportPlanHttpHandler({
    verifyIdToken: async () => ({
      uid: 'member-1',
      email: 'verified@example.com',
      email_verified: true,
    }),
    handleSupportPlan: async (request) => ({
      recipient: `${request.auth.token.email.slice(0, 1)}***@example.com`,
      messageId: 'message-1',
    }),
    allowedOrigins: allowedOrigin,
    logger: { error: () => {} },
    ...overrides,
  })
}

test('Alibaba Cloud HTTP adapter handles CORS preflight for an allowed site', async () => {
  const response = await createHandler()(createEvent({ method: 'OPTIONS' }))

  assert.equal(response.statusCode, 204)
  assert.equal(response.headers['Access-Control-Allow-Origin'], allowedOrigin)
  assert.match(response.headers['Access-Control-Allow-Methods'], /POST/u)
})

test('Alibaba Cloud HTTP adapter rejects untrusted origins and missing tokens', async () => {
  const handler = createHandler()
  const deniedOrigin = await handler(createEvent({ origin: 'https://attacker.example' }))
  const missingToken = await handler(createEvent({ authorization: '' }))

  assert.equal(deniedOrigin.statusCode, 403)
  assert.equal(deniedOrigin.headers['Access-Control-Allow-Origin'], undefined)
  assert.equal(missingToken.statusCode, 401)
  assert.equal(JSON.parse(missingToken.body).error.code, 'unauthenticated')
})

test('Alibaba Cloud HTTP adapter verifies Firebase identity and returns plan data', async () => {
  let verifiedToken
  let receivedRequest
  const handler = createHandler({
    verifyIdToken: async (token) => {
      verifiedToken = token
      return {
        uid: 'member-1',
        email: 'verified@example.com',
        email_verified: true,
      }
    },
    handleSupportPlan: async (request) => {
      receivedRequest = request
      return { recipient: 'v***@example.com', messageId: 'message-1' }
    },
  })

  const response = await handler(createEvent())
  const body = JSON.parse(response.body)

  assert.equal(response.statusCode, 200)
  assert.equal(verifiedToken, 'valid-token')
  assert.equal(receivedRequest.auth.uid, 'member-1')
  assert.deepEqual(receivedRequest.data, validPayload)
  assert.equal(body.data.recipient, 'v***@example.com')
})

test('Alibaba Cloud HTTP adapter routes rating saves without trusting a body resource ID', async () => {
  let receivedRequest
  const handler = createHandler({
    handleSaveRating: async (request) => {
      receivedRequest = request
      return { score: request.data.score, isNew: true }
    },
  })
  const response = await handler(createEvent({
    path: '/ratings/beyond-blue',
    body: { score: 4, resourceId: 'lifeline-australia' },
  }))

  assert.equal(response.statusCode, 200)
  assert.equal(receivedRequest.data.resourceId, 'beyond-blue')
  assert.equal(receivedRequest.data.score, 4)
})

test('Alibaba Cloud HTTP adapter routes staff analytics rebuilds and returns 404 elsewhere', async () => {
  const handler = createHandler({
    handleRebuildRatingAnalytics: async () => ({ rebuilt: 6 }),
  })
  const rebuilt = await handler(createEvent({ path: '/rating-analytics/rebuild', body: {} }))
  const missing = await handler(createEvent({ path: '/unknown', body: {} }))

  assert.equal(rebuilt.statusCode, 200)
  assert.equal(JSON.parse(rebuilt.body).data.rebuilt, 6)
  assert.equal(missing.statusCode, 404)
  assert.equal(JSON.parse(missing.body).error.code, 'not-found')
})

test('Alibaba Cloud HTTP adapter does not expose unexpected server errors', async () => {
  const response = await createHandler({
    handleSupportPlan: async () => {
      throw new Error('private provider detail')
    },
  })(createEvent())
  const body = JSON.parse(response.body)

  assert.equal(response.statusCode, 500)
  assert.equal(body.error.code, 'internal')
  assert.doesNotMatch(response.body, /private provider detail/u)
})

test('Firebase Admin credentials support JSON and separate environment variables', () => {
  const fromJson = getServiceAccount({
    FIREBASE_SERVICE_ACCOUNT_JSON: JSON.stringify({
      project_id: 'sliverlink-health',
      client_email: 'firebase-admin@example.test',
      private_key: 'line-one\\nline-two',
    }),
  })
  const fromVariables = getServiceAccount({
    FIREBASE_PROJECT_ID: 'sliverlink-health',
    FIREBASE_CLIENT_EMAIL: 'firebase-admin@example.test',
    FIREBASE_PRIVATE_KEY: 'line-one\\nline-two',
  })

  assert.equal(fromJson.privateKey, 'line-one\nline-two')
  assert.deepEqual(fromVariables, fromJson)
})

test('Firebase Admin credentials reject malformed JSON values and fields', () => {
  assert.throws(
    () => getServiceAccount({ FIREBASE_SERVICE_ACCOUNT_JSON: 'null' }),
    /not configured/u,
  )
  assert.throws(
    () => getServiceAccount({
      FIREBASE_SERVICE_ACCOUNT_JSON: JSON.stringify({
        project_id: 'sliverlink-health',
        client_email: 'firebase-admin@example.test',
        private_key: 123,
      }),
    }),
    /not configured/u,
  )
})
