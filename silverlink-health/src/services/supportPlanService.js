import { requireFirebase } from '../firebase'
import { createSupportPlanSender, createSupportPlanApiError } from './supportPlanApi'

const supportPlanApiUrl = import.meta.env.VITE_SUPPORT_PLAN_API_URL?.trim() || ''

export async function sendSupportPlan(payload) {
  const { auth } = requireFirebase()

  if (!auth.currentUser) {
    throw createSupportPlanApiError('unauthenticated', 'Log in before sending a support plan.')
  }

  const sender = createSupportPlanSender({
    apiUrl: supportPlanApiUrl,
    getIdToken: () => auth.currentUser.getIdToken(true),
  })

  return sender(payload)
}
