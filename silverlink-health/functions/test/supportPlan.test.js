const test = require('node:test')
const assert = require('node:assert/strict')
const { PDFDocument } = require('pdf-lib')
const {
  buildSupportPlanEmail,
  createResendSender,
  createSupportPlanPdf,
  maskEmail,
  SupportPlanError,
  validateSupportPlanPayload,
} = require('../src/supportPlan')

const validPlan = {
  resourceIds: ['lifeline-australia', 'head-to-health'],
  contactPreference: 'Phone',
  notes: 'Call in the morning and write down the next steps.',
}

test('validateSupportPlanPayload accepts only known services and fields', () => {
  assert.deepEqual(validateSupportPlanPayload(validPlan), validPlan)

  assert.throws(
    () => validateSupportPlanPayload({ ...validPlan, recipientEmail: 'other@example.com' }),
    (error) => error instanceof SupportPlanError && error.code === 'invalid-argument',
  )
  assert.throws(
    () => validateSupportPlanPayload({ ...validPlan, resourceIds: ['unknown-service'] }),
    /valid support services/u,
  )
})

test('validateSupportPlanPayload rejects duplicate resources and unsafe notes', () => {
  assert.throws(
    () =>
      validateSupportPlanPayload({
        ...validPlan,
        resourceIds: ['lifeline-australia', 'lifeline-australia'],
      }),
    /valid support services/u,
  )
  assert.throws(
    () => validateSupportPlanPayload({ ...validPlan, notes: '<script>alert(1)</script>' }),
    /plain text/u,
  )
})

test('buildSupportPlanEmail escapes user text and includes fixed service contacts', () => {
  const email = buildSupportPlanEmail({
    recipientName: 'Jane & John',
    plan: { ...validPlan, notes: 'Morning & afternoon' },
  })

  assert.match(email.subject, /support plan/u)
  assert.match(email.text, /13 11 14/u)
  assert.match(email.html, /Jane &amp; John/u)
  assert.match(email.html, /Morning &amp; afternoon/u)
})

test('createSupportPlanPdf creates a readable PDF document', async () => {
  const bytes = await createSupportPlanPdf({
    recipientName: 'Jane Citizen',
    recipientEmail: 'jane@example.com',
    plan: validPlan,
    createdAt: new Date('2026-08-14T01:00:00.000Z'),
  })
  const document = await PDFDocument.load(bytes)

  assert.match(Buffer.from(bytes.subarray(0, 8)).toString('ascii'), /^%PDF-/u)
  assert.ok(document.getPageCount() >= 1)
  assert.equal(document.getTitle(), 'SilverLink Health support plan')
})

test('createResendSender fixes the recipient and attaches the generated PDF', async () => {
  let request
  const send = createResendSender({
    apiKey: 'test-api-key',
    fromAddress: 'SilverLink Health <plans@example.com>',
    fetchImpl: async (url, options) => {
      request = { url, options, body: JSON.parse(options.body) }
      return { ok: true, json: async () => ({ id: 'email-message-1' }) }
    },
  })
  const messageId = await send({
    to: 'verified@example.com',
    subject: 'Plan',
    html: '<p>Plan</p>',
    text: 'Plan',
    attachment: new Uint8Array([37, 80, 68, 70]),
  })

  assert.equal(messageId, 'email-message-1')
  assert.equal(request.url, 'https://api.resend.com/emails')
  assert.deepEqual(request.body.to, ['verified@example.com'])
  assert.equal(request.body.attachments[0].filename, 'silverlink-support-plan.pdf')
  assert.equal(request.options.headers.Authorization, 'Bearer test-api-key')
})

test('maskEmail does not return the complete recipient address', () => {
  assert.equal(maskEmail('jane@example.com'), 'j***@example.com')
  assert.equal(maskEmail('invalid'), 'your verified email address')
})
