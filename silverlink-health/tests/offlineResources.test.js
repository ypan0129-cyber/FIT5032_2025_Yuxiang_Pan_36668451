import test from 'node:test'
import assert from 'node:assert/strict'
import { readOnlineState } from '../src/services/connectivity.js'
import {
  normaliseSavedResourceIds,
  parseSavedResourceIds,
  readSavedResourceIds,
  SAVED_RESOURCES_STORAGE_KEY,
  updateSavedResourceIds,
  writeSavedResourceIds,
} from '../src/utils/savedResources.js'

function createStorage(initialValue = null) {
  const values = new Map()

  if (initialValue !== null) {
    values.set(SAVED_RESOURCES_STORAGE_KEY, initialValue)
  }

  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
    value: () => values.get(SAVED_RESOURCES_STORAGE_KEY),
  }
}

test('saved resource IDs accept only unique entries from the public directory', () => {
  assert.deepEqual(normaliseSavedResourceIds([
    'beyond-blue',
    'unknown-resource',
    'beyond-blue',
    { id: 'lifeline-australia', email: 'private@example.com' },
    'lifeline-australia',
  ]), ['beyond-blue', 'lifeline-australia'])
  assert.deepEqual(normaliseSavedResourceIds({ id: 'beyond-blue' }), [])
})

test('saved resource parsing fails closed for malformed local data', () => {
  assert.deepEqual(parseSavedResourceIds('not-json'), [])
  assert.deepEqual(parseSavedResourceIds('{"uid":"private"}'), [])
  assert.deepEqual(parseSavedResourceIds(''), [])
})

test('saved resource storage contains only the allowlisted public ID array', () => {
  const storage = createStorage()
  const written = writeSavedResourceIds(storage, [
    'friendline',
    'not-published',
    'friendline',
  ])

  assert.deepEqual(written, ['friendline'])
  assert.equal(storage.value(), '["friendline"]')
  assert.deepEqual(readSavedResourceIds(storage), ['friendline'])
  assert.doesNotMatch(storage.value(), /uid|email|displayName|role|score/u)
})

test('saved resource updates preserve valid entries and reject unknown IDs', () => {
  const initial = ['beyond-blue']

  assert.deepEqual(
    updateSavedResourceIds(initial, 'lifeline-australia', true),
    ['beyond-blue', 'lifeline-australia'],
  )
  assert.deepEqual(
    updateSavedResourceIds(initial, 'beyond-blue', false),
    [],
  )
  assert.deepEqual(
    updateSavedResourceIds(initial, '../account', true),
    ['beyond-blue'],
  )
})

test('connectivity state treats only an explicit offline signal as offline', () => {
  assert.equal(readOnlineState({ onLine: true }), true)
  assert.equal(readOnlineState({ onLine: false }), false)
  assert.equal(readOnlineState(null), true)
})
