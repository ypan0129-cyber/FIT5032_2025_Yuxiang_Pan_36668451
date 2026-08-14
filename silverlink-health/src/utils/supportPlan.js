import { resources } from '../data/resources.js'

export const supportPlanContactPreferences = Object.freeze(['Phone', 'Online', 'In person'])
export const maxSupportPlanResources = 3
export const maxSupportPlanNotesLength = 500

const validResourceIds = new Set(resources.map((resource) => resource.id))
const unsafeControlCharacterPattern = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/u

export function validateSupportPlan(form) {
  const errors = {}
  const resourceIds = Array.isArray(form?.resourceIds) ? form.resourceIds : []
  const notes = typeof form?.notes === 'string' ? form.notes.trim() : ''

  if (
    resourceIds.length < 1 ||
    resourceIds.length > maxSupportPlanResources ||
    resourceIds.some((id) => !validResourceIds.has(id)) ||
    new Set(resourceIds).size !== resourceIds.length
  ) {
    errors.resourceIds = `Choose between 1 and ${maxSupportPlanResources} services.`
  }

  if (!supportPlanContactPreferences.includes(form?.contactPreference)) {
    errors.contactPreference = 'Choose a contact preference.'
  }

  if (
    notes.length > maxSupportPlanNotesLength ||
    /[<>]/u.test(notes) ||
    unsafeControlCharacterPattern.test(notes)
  ) {
    errors.notes = `Use plain text with no more than ${maxSupportPlanNotesLength} characters.`
  }

  return errors
}

export function normaliseSupportPlan(form) {
  return {
    resourceIds: [...form.resourceIds],
    contactPreference: form.contactPreference,
    notes: form.notes.trim(),
  }
}
