import test from 'node:test'
import assert from 'node:assert/strict'
import { createSendSupportPlanHandler } from '../src/handler.js'

const validPlan = {
  resourceIds: ['lifeline-australia'],
  contactPreference: 'Phone',
  notes: '',
}

function createHandlerDatabase(role = 'member') {
  let quota = null
  const quotaReference = {
    set: async (values) => {
      quota = { ...quota, ...values }
    },
  }

  return {
    collection: (name) => ({
      doc: () =>
        name === 'users'
          ? { get: async () => ({ exists: true, data: () => ({ role, displayName: 'Jane' }) }) }
          : quotaReference,
    }),
    runTransaction: async (callback) =>
      callback({
        get: async () => ({ exists: Boolean(quota), data: () => quota }),
        set: (_reference, values) => {
          quota = { ...quota, ...values }
        },
      }),
  }
}

function createRequest(token = {}) {
  return {
    auth: {
      uid: 'member-1',
      token: {
        email: 'verified@example.com',
        email_verified: true,
        ...token,
      },
    },
    data: validPlan,
  }
}

test('support plan handler requires authentication and a verified email', async () => {
  const handler = createSendSupportPlanHandler({
    db: createHandlerDatabase(),
    sendEmail: async () => 'message-1',
    timestampFromDate: (date) => date,
  })

  await assert.rejects(handler({ auth: null, data: validPlan }), /Log in/u)
  await assert.rejects(
    handler(createRequest({ email_verified: false })),
    /Verify your account email/u,
  )
})

test('support plan handler enforces the Firestore member role', async () => {
  const handler = createSendSupportPlanHandler({
    db: createHandlerDatabase('staff'),
    sendEmail: async () => 'message-1',
    timestampFromDate: (date) => date,
  })

  await assert.rejects(handler(createRequest()), /Only member accounts/u)
})

test('support plan handler sends only to the verified token email', async () => {
  let sentMessage
  const handler = createSendSupportPlanHandler({
    db: createHandlerDatabase(),
    sendEmail: async (message) => {
      sentMessage = message
      return 'message-1'
    },
    timestampFromDate: (date) => date,
    now: class extends Date {
      constructor() {
        super('2026-08-14T01:00:00.000Z')
      }
    },
  })

  const result = await handler(createRequest())

  assert.equal(sentMessage.to, 'verified@example.com')
  assert.match(Buffer.from(sentMessage.attachment.subarray(0, 8)).toString('ascii'), /^%PDF-/u)
  assert.equal(result.recipient, 'v***@example.com')
  assert.equal(result.messageId, 'message-1')
})
