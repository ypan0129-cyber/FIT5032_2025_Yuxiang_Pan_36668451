import test from 'node:test'
import assert from 'node:assert/strict'
import { createSupportPlanSender } from '../src/services/supportPlanApi.js'

const payload = {
  resourceIds: ['lifeline-australia'],
  contactPreference: 'Phone',
  notes: '',
}

test('support plan API sends a Firebase ID token without cookies', async () => {
  let request
  const send = createSupportPlanSender({
    apiUrl: 'https://support-plan.example.test/send',
    getIdToken: async () => 'firebase-token',
    fetchImplementation: async (url, options) => {
      request = { url, options }
      return {
        ok: true,
        json: async () => ({ data: { recipient: 'v***@example.com' } }),
      }
    },
  })

  const result = await send(payload)

  assert.equal(request.url, 'https://support-plan.example.test/send')
  assert.equal(request.options.credentials, 'omit')
  assert.equal(request.options.headers.Authorization, 'Bearer firebase-token')
  assert.deepEqual(JSON.parse(request.options.body), payload)
  assert.equal(result.recipient, 'v***@example.com')
})

test('support plan API maps server and network failures to stable codes', async () => {
  const rejected = createSupportPlanSender({
    apiUrl: 'https://support-plan.example.test/',
    getIdToken: async () => 'firebase-token',
    fetchImplementation: async () => ({
      ok: false,
      json: async () => ({
        error: { code: 'resource-exhausted', message: 'Wait before retrying.' },
      }),
    }),
  })
  const unavailable = createSupportPlanSender({
    apiUrl: 'https://support-plan.example.test/',
    getIdToken: async () => 'firebase-token',
    fetchImplementation: async () => {
      throw new TypeError('network detail')
    },
  })

  await assert.rejects(rejected(payload), { code: 'support-plan/resource-exhausted' })
  await assert.rejects(unavailable(payload), { code: 'support-plan/unavailable' })
})

test('support plan API rejects unsafe or missing endpoint configuration', async () => {
  const options = {
    getIdToken: async () => 'firebase-token',
    fetchImplementation: async () => {
      throw new Error('fetch must not be called')
    },
  }

  await assert.rejects(createSupportPlanSender({ ...options, apiUrl: '' })(payload), {
    code: 'support-plan/not-configured',
  })
  await assert.rejects(
    createSupportPlanSender({ ...options, apiUrl: 'http://public.example.test/' })(payload),
    { code: 'support-plan/not-configured' },
  )
})
