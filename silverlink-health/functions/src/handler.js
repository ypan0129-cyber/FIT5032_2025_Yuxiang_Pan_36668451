const {
  completeEmailAttempt,
  failEmailAttempt,
  reserveEmailAttempt,
} = require('./emailQuota')
const {
  buildSupportPlanEmail,
  createSupportPlanPdf,
  maskEmail,
  SupportPlanError,
  validateSupportPlanPayload,
} = require('./supportPlan')

function getVerifiedEmail(auth) {
  const email = typeof auth?.token?.email === 'string' ? auth.token.email.trim() : ''

  if (!auth?.uid) {
    throw new SupportPlanError('unauthenticated', 'Log in before sending a support plan.')
  }

  if (!email || auth.token.email_verified !== true) {
    throw new SupportPlanError(
      'failed-precondition',
      'Verify your account email before sending a support plan.',
    )
  }

  return email
}

function getRecipientName(profile, auth) {
  const candidates = [profile?.displayName, auth?.token?.name, 'SilverLink member']
  const name = candidates.find(
    (candidate) => typeof candidate === 'string' && candidate.trim().length >= 2,
  )

  return name.trim().slice(0, 80)
}

function createSendSupportPlanHandler({ db, sendEmail, timestampFromDate, now = Date }) {
  return async function handleSendSupportPlan(request) {
    const recipientEmail = getVerifiedEmail(request.auth)
    const plan = validateSupportPlanPayload(request.data)
    const profileSnapshot = await db.collection('users').doc(request.auth.uid).get()
    const profile = profileSnapshot.exists ? profileSnapshot.data() : null

    if (profile?.role !== 'member') {
      throw new SupportPlanError(
        'permission-denied',
        'Only member accounts can send a personal support plan.',
      )
    }

    const recipientName = getRecipientName(profile, request.auth)
    const requestedAt = new now()
    const quotaReference = await reserveEmailAttempt({
      db,
      uid: request.auth.uid,
      now: requestedAt,
      timestampFromDate,
    })

    try {
      const [attachment, email] = await Promise.all([
        createSupportPlanPdf({
          recipientName,
          recipientEmail,
          plan,
          createdAt: requestedAt,
        }),
        Promise.resolve(buildSupportPlanEmail({ recipientName, plan })),
      ])
      const messageId = await sendEmail({
        to: recipientEmail,
        ...email,
        attachment,
      })

      await completeEmailAttempt({
        reference: quotaReference,
        messageId,
        now: requestedAt,
        timestampFromDate,
      })

      return {
        messageId,
        recipient: maskEmail(recipientEmail),
        sentAt: requestedAt.toISOString(),
      }
    } catch (error) {
      await failEmailAttempt({
        reference: quotaReference,
        now: requestedAt,
        timestampFromDate,
      }).catch(() => {})
      throw error
    }
  }
}

module.exports = { createSendSupportPlanHandler }
