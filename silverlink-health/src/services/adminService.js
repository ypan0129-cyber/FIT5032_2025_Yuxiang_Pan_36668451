import { requireFirebase } from '../firebase'
import { createAdminApiError, createAdminMetricsLoader } from './adminApi'

const adminApiUrl = import.meta.env.VITE_SUPPORT_PLAN_API_URL?.trim() || ''

export async function getAdminMetrics() {
  const { auth } = requireFirebase()

  if (!auth.currentUser) {
    throw createAdminApiError('unauthenticated', 'Log in to view system metrics.')
  }

  const loadMetrics = createAdminMetricsLoader({
    apiUrl: adminApiUrl,
    getIdToken: () => auth.currentUser.getIdToken(true),
  })

  return loadMetrics()
}

export function getAdminErrorMessage(error) {
  const messages = {
    'admin/unauthenticated': 'Log in again to view system metrics.',
    'admin/permission-denied': 'This account does not have administrator access.',
    'admin/not-configured': 'Administration metrics are not configured for this environment.',
    'admin/unavailable': 'System metrics are temporarily unavailable. Try again later.',
    'admin/internal': 'System metrics could not be loaded. Try again later.',
  }

  return messages[error?.code] || 'System metrics could not be loaded. Try again later.'
}
