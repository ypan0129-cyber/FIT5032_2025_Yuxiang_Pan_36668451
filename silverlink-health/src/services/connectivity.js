import { readonly, ref } from 'vue'

const isOnline = ref(true)
let isInitialised = false

function getBrowserNavigator() {
  return typeof navigator === 'undefined' ? null : navigator
}

function getBrowserEventTarget() {
  return typeof window === 'undefined' ? null : window
}

export function readOnlineState(browserNavigator = getBrowserNavigator()) {
  return browserNavigator?.onLine !== false
}

export function initialiseConnectivity({
  browserNavigator = getBrowserNavigator(),
  eventTarget = getBrowserEventTarget(),
} = {}) {
  if (isInitialised) {
    return
  }

  isOnline.value = readOnlineState(browserNavigator)
  eventTarget?.addEventListener?.('online', () => {
    isOnline.value = true
  })
  eventTarget?.addEventListener?.('offline', () => {
    isOnline.value = false
  })
  isInitialised = true
}

export function useConnectivity() {
  initialiseConnectivity()

  return { isOnline: readonly(isOnline) }
}
