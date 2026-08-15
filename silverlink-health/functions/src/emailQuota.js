const { SupportPlanError } = require('./supportPlan')

const EMAIL_COOLDOWN_MS = 60_000
const EMAIL_DAILY_LIMIT = 5

function toMillis(value) {
  if (typeof value?.toMillis === 'function') return value.toMillis()
  if (value instanceof Date) return value.getTime()
  return Number(value) || 0
}

function getUtcDayKey(date) {
  return date.toISOString().slice(0, 10)
}

async function reserveEmailAttempt({
  db,
  uid,
  now,
  timestampFromDate,
  cooldownMs = EMAIL_COOLDOWN_MS,
  dailyLimit = EMAIL_DAILY_LIMIT,
}) {
  const reference = db.collection('emailDispatches').doc(uid)
  const dayKey = getUtcDayKey(now)

  await db.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(reference)
    const previous = snapshot.exists ? snapshot.data() : {}
    const lastAttemptAt = toMillis(previous.lastAttemptAt)

    if (lastAttemptAt && now.getTime() - lastAttemptAt < cooldownMs) {
      throw new SupportPlanError(
        'resource-exhausted',
        'Wait one minute before sending another support plan.',
      )
    }

    const dailyCount = previous.dayKey === dayKey ? Number(previous.dailyCount) || 0 : 0

    if (dailyCount >= dailyLimit) {
      throw new SupportPlanError(
        'resource-exhausted',
        'The daily support plan email limit has been reached.',
      )
    }

    transaction.set(
      reference,
      {
        dayKey,
        dailyCount: dailyCount + 1,
        lastAttemptAt: timestampFromDate(now),
        lastStatus: 'pending',
      },
      { merge: true },
    )
  })

  return reference
}

function completeEmailAttempt({ reference, messageId, now, timestampFromDate }) {
  return reference.set(
    {
      lastStatus: 'sent',
      lastSentAt: timestampFromDate(now),
      providerMessageId: messageId,
    },
    { merge: true },
  )
}

function failEmailAttempt({ reference, now, timestampFromDate }) {
  return reference.set(
    {
      lastStatus: 'failed',
      lastFailureAt: timestampFromDate(now),
    },
    { merge: true },
  )
}

module.exports = {
  EMAIL_COOLDOWN_MS,
  EMAIL_DAILY_LIMIT,
  completeEmailAttempt,
  failEmailAttempt,
  getUtcDayKey,
  reserveEmailAttempt,
}
