import { initializeApp } from 'firebase-admin/app'
import { getFirestore, Timestamp } from 'firebase-admin/firestore'
import { logger } from 'firebase-functions'
import { defineSecret, defineString } from 'firebase-functions/params'
import { HttpsError, onCall } from 'firebase-functions/v2/https'
import { createSendSupportPlanHandler } from './handler.js'
import { createResendSender, SupportPlanError } from './supportPlan.js'

initializeApp()

const db = getFirestore()
const resendApiKey = defineSecret('RESEND_API_KEY')
const emailFrom = defineString('EMAIL_FROM', {
  default: 'SilverLink Health <onboarding@resend.dev>',
  description: 'Verified sender used for support plan emails.',
})

function mapFunctionError(error, uid) {
  if (error instanceof SupportPlanError) {
    return new HttpsError(error.code, error.message)
  }

  logger.error('Support plan email failed.', {
    uid: uid || 'unauthenticated',
    errorName: error?.name || 'Error',
  })
  return new HttpsError('internal', 'The support plan could not be sent. Try again later.')
}

export const sendSupportPlan = onCall(
  {
    region: 'australia-southeast1',
    secrets: [resendApiKey],
    timeoutSeconds: 60,
    memory: '256MiB',
    maxInstances: 10,
  },
  async (request) => {
    try {
      const handler = createSendSupportPlanHandler({
        db,
        sendEmail: createResendSender({
          apiKey: resendApiKey.value(),
          fromAddress: emailFrom.value(),
        }),
        timestampFromDate: (date) => Timestamp.fromDate(date),
      })

      return await handler(request)
    } catch (error) {
      throw mapFunctionError(error, request.auth?.uid)
    }
  },
)
