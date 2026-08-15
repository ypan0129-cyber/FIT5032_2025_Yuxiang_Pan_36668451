import { resources } from '../data/resources.js'

export const SAVED_RESOURCES_STORAGE_KEY = 'silverlink.saved-public-resource-ids.v1'

const PUBLIC_RESOURCE_IDS = Object.freeze(resources.map(({ id }) => id))
const PUBLIC_RESOURCE_ID_SET = new Set(PUBLIC_RESOURCE_IDS)

export function normaliseSavedResourceIds(value) {
  if (!Array.isArray(value)) {
    return []
  }

  return [...new Set(
    value.filter((resourceId) => (
      typeof resourceId === 'string' && PUBLIC_RESOURCE_ID_SET.has(resourceId)
    )),
  )]
}

export function parseSavedResourceIds(value) {
  if (typeof value !== 'string' || !value) {
    return []
  }

  try {
    return normaliseSavedResourceIds(JSON.parse(value))
  } catch {
    return []
  }
}

export function readSavedResourceIds(storage) {
  if (!storage || typeof storage.getItem !== 'function') {
    return []
  }

  try {
    return parseSavedResourceIds(storage.getItem(SAVED_RESOURCES_STORAGE_KEY))
  } catch {
    return []
  }
}

export function writeSavedResourceIds(storage, resourceIds) {
  if (!storage || typeof storage.setItem !== 'function') {
    throw new Error('Saved resources are unavailable in this browser.')
  }

  const normalisedIds = normaliseSavedResourceIds(resourceIds)
  storage.setItem(SAVED_RESOURCES_STORAGE_KEY, JSON.stringify(normalisedIds))

  return normalisedIds
}

export function updateSavedResourceIds(resourceIds, resourceId, shouldSave) {
  const normalisedIds = normaliseSavedResourceIds(resourceIds)

  if (!PUBLIC_RESOURCE_ID_SET.has(resourceId)) {
    return normalisedIds
  }

  if (shouldSave) {
    return normaliseSavedResourceIds([...normalisedIds, resourceId])
  }

  return normalisedIds.filter((savedId) => savedId !== resourceId)
}
