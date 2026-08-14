import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import {
  createProviderMemberProfile,
  getProviderDisplayName,
  getSignInMethodLabel,
} from '../src/utils/providerProfile.js'

test('getProviderDisplayName uses a valid provider name', () => {
  assert.equal(
    getProviderDisplayName({ displayName: '  Jane   Citizen  ', email: 'jane@example.com' }),
    'Jane Citizen',
  )
})

test('getProviderDisplayName rejects unsafe provider text and uses the email prefix', () => {
  assert.equal(
    getProviderDisplayName({ displayName: '<script>alert(1)</script>', email: 'safe.member@example.com' }),
    'safe.member',
  )
  assert.equal(getProviderDisplayName({ displayName: '<>', email: 'x@example.com' }), 'SilverLink member')
})

test('createProviderMemberProfile always creates a member role', () => {
  const createdAt = Symbol('server timestamp')

  assert.deepEqual(
    createProviderMemberProfile(
      { displayName: 'Jane Citizen', email: 'jane@example.com', role: 'staff' },
      createdAt,
    ),
    {
      displayName: 'Jane Citizen',
      role: 'member',
      createdAt,
    },
  )
})

test('getSignInMethodLabel reports Firebase provider methods', () => {
  assert.equal(getSignInMethodLabel([{ providerId: 'google.com' }]), 'Google')
  assert.equal(
    getSignInMethodLabel([{ providerId: 'password' }, { providerId: 'google.com' }]),
    'Google / Email and password',
  )
  assert.equal(getSignInMethodLabel([]), 'Firebase Authentication')
})

test('Firestore rules keep new profiles fixed to member and block client role changes', async () => {
  const rulesPath = fileURLToPath(new URL('../firestore.rules', import.meta.url))
  const rules = await readFile(rulesPath, 'utf8')

  assert.match(rules, /request\.resource\.data\.role == 'member'/u)
  assert.match(rules, /allow list, update, delete: if false;/u)
})
