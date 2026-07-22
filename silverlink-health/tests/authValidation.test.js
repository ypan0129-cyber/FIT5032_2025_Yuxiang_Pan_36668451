import test from 'node:test'
import assert from 'node:assert/strict'
import {
  normaliseDisplayName,
  validateLogin,
  validateRegistration,
} from '../src/utils/authValidation.js'

test('normaliseDisplayName trims and collapses whitespace', () => {
  assert.equal(normaliseDisplayName('  Jane   Citizen  '), 'Jane Citizen')
})

test('validateLogin rejects malformed email and missing password', () => {
  assert.deepEqual(validateLogin({ email: 'not-an-email', password: '' }), {
    email: 'Enter a valid email address.',
    password: 'Enter your password.',
  })
})

test('validateRegistration accepts a valid member form', () => {
  assert.deepEqual(
    validateRegistration({
      displayName: 'Jane Citizen',
      email: 'jane@example.com',
      password: 'password123',
      confirmPassword: 'password123',
    }),
    {},
  )
})

test('validateRegistration reports name, password and confirmation errors', () => {
  assert.deepEqual(
    validateRegistration({
      displayName: 'J',
      email: 'jane@example.com',
      password: 'short',
      confirmPassword: 'different',
    }),
    {
      displayName: 'Name must contain at least 2 characters.',
      password: 'Password must contain at least 8 characters.',
      confirmPassword: 'Passwords do not match.',
    },
  )
})
