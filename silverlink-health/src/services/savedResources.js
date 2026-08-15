import { computed, readonly, ref } from 'vue'
import { resources } from '../data/resources.js'
import {
  parseSavedResourceIds,
  readSavedResourceIds,
  SAVED_RESOURCES_STORAGE_KEY,
  updateSavedResourceIds,
  writeSavedResourceIds,
} from '../utils/savedResources.js'

const savedResourceIds = ref([])
const savedResources = computed(() => (
  resources.filter(({ id }) => savedResourceIds.value.includes(id))
))

let isInitialised = false
let browserStorage = null

function getBrowserStorage() {
  try {
    return typeof window === 'undefined' ? null : window.localStorage
  } catch {
    return null
  }
}

function getBrowserEventTarget() {
  return typeof window === 'undefined' ? null : window
}

export function initialiseSavedResources({
  storage = getBrowserStorage(),
  eventTarget = getBrowserEventTarget(),
} = {}) {
  if (isInitialised) {
    return
  }

  browserStorage = storage
  savedResourceIds.value = readSavedResourceIds(browserStorage)

  eventTarget?.addEventListener?.('storage', (event) => {
    if (event.key === SAVED_RESOURCES_STORAGE_KEY) {
      savedResourceIds.value = parseSavedResourceIds(event.newValue)
    } else if (event.key === null) {
      savedResourceIds.value = []
    }
  })

  isInitialised = true
}

export function useSavedResources() {
  initialiseSavedResources()

  function isResourceSaved(resourceId) {
    return savedResourceIds.value.includes(resourceId)
  }

  function setResourceSaved(resourceId, shouldSave) {
    const nextIds = updateSavedResourceIds(
      savedResourceIds.value,
      resourceId,
      shouldSave,
    )

    savedResourceIds.value = writeSavedResourceIds(browserStorage, nextIds)
    return savedResourceIds.value.includes(resourceId)
  }

  function toggleSavedResource(resourceId) {
    return setResourceSaved(resourceId, !isResourceSaved(resourceId))
  }

  return {
    savedResourceIds: readonly(savedResourceIds),
    savedResources,
    isResourceSaved,
    setResourceSaved,
    toggleSavedResource,
  }
}
