import test from 'node:test'
import assert from 'node:assert/strict'
import {
  maxSupportPlanNotesLength,
  normaliseSupportPlan,
  validateSupportPlan,
} from '../src/utils/supportPlan.js'

const validPlan = {
  resourceIds: ['lifeline-australia', 'head-to-health'],
  contactPreference: 'Phone',
  notes: '  Call in the morning.  ',
}

test('validateSupportPlan accepts known services and a valid contact preference', () => {
  assert.deepEqual(validateSupportPlan(validPlan), {})
})

test('validateSupportPlan rejects missing, duplicate and unknown services', () => {
  assert.ok(validateSupportPlan({ ...validPlan, resourceIds: [] }).resourceIds)
  assert.ok(
    validateSupportPlan({
      ...validPlan,
      resourceIds: ['lifeline-australia', 'lifeline-australia'],
    }).resourceIds,
  )
  assert.ok(validateSupportPlan({ ...validPlan, resourceIds: ['private-resource'] }).resourceIds)
})

test('validateSupportPlan limits notes to safe plain text', () => {
  assert.ok(validateSupportPlan({ ...validPlan, notes: '<script>alert(1)</script>' }).notes)
  assert.ok(
    validateSupportPlan({ ...validPlan, notes: 'a'.repeat(maxSupportPlanNotesLength + 1) }).notes,
  )
})

test('normaliseSupportPlan trims notes and clones selected resource IDs', () => {
  const result = normaliseSupportPlan(validPlan)

  assert.deepEqual(result, {
    resourceIds: validPlan.resourceIds,
    contactPreference: 'Phone',
    notes: 'Call in the morning.',
  })
  assert.notEqual(result.resourceIds, validPlan.resourceIds)
})
