import { httpsCallable } from 'firebase/functions'
import { requireFirebase } from '../firebase'

export async function sendSupportPlan(payload) {
  const { functions } = requireFirebase()
  const callable = httpsCallable(functions, 'sendSupportPlan', { timeout: 65_000 })
  const response = await callable(payload)

  return response.data
}
