const { getUtcDayKey } = require('./emailQuota')
const { RESOURCE_IDS, normaliseAggregate } = require('./ratingAnalytics')
const { SupportPlanError } = require('./supportPlan')

const KNOWN_ROLES = Object.freeze(['member', 'staff', 'admin'])
const EMAIL_STATUSES = Object.freeze(['sent', 'failed', 'pending'])

function getDocuments(snapshot) {
  return Array.isArray(snapshot?.docs) ? snapshot.docs : []
}

function getDocumentData(snapshot) {
  const data = snapshot?.data?.()
  return data && typeof data === 'object' && !Array.isArray(data) ? data : {}
}

function safeCount(value) {
  return Number.isSafeInteger(value) && value >= 0 ? value : 0
}

function summariseUsers(documents) {
  const roles = { member: 0, staff: 0, admin: 0, other: 0 }

  for (const document of documents) {
    const role = getDocumentData(document).role

    if (KNOWN_ROLES.includes(role)) {
      roles[role] += 1
    } else {
      roles.other += 1
    }
  }

  return { total: documents.length, roles }
}

function summariseRatings(documents) {
  const documentsById = new Map(documents.map((document) => [document.id, document]))
  let totalRatings = 0
  let scoreTotal = 0
  let ratedResources = 0

  for (const resourceId of RESOURCE_IDS) {
    const document = documentsById.get(resourceId)
    const aggregate = normaliseAggregate(getDocumentData(document))

    if (!aggregate) {
      continue
    }

    if (
      !Number.isSafeInteger(aggregate.ratingCount) ||
      !Number.isSafeInteger(aggregate.scoreTotal) ||
      !Number.isSafeInteger(totalRatings + aggregate.ratingCount) ||
      !Number.isSafeInteger(scoreTotal + aggregate.scoreTotal)
    ) {
      continue
    }

    totalRatings += aggregate.ratingCount
    scoreTotal += aggregate.scoreTotal
    ratedResources += aggregate.ratingCount > 0 ? 1 : 0
  }

  return {
    totalRatings,
    ratedResources,
    resourceCount: RESOURCE_IDS.length,
    averageScore: totalRatings ? scoreTotal / totalRatings : null,
  }
}

function summariseEmails(documents, dayKey) {
  const latestStatuses = { sent: 0, failed: 0, pending: 0, other: 0 }
  let attemptsToday = 0

  for (const document of documents) {
    const data = getDocumentData(document)

    if (data.dayKey === dayKey) {
      attemptsToday += safeCount(data.dailyCount)
    }

    if (EMAIL_STATUSES.includes(data.lastStatus)) {
      latestStatuses[data.lastStatus] += 1
    } else {
      latestStatuses.other += 1
    }
  }

  return {
    attemptsToday,
    trackedAccounts: documents.length,
    latestStatuses,
  }
}

async function requireAdmin(db, uid) {
  const profileSnapshot = await db.collection('users').doc(uid).get()
  const profile = profileSnapshot.exists ? getDocumentData(profileSnapshot) : null

  if (profile?.role !== 'admin') {
    throw new SupportPlanError(
      'permission-denied',
      'Only administrator accounts can view system metrics.',
    )
  }
}

function createAdminMetricsHandler({ db, now = () => new Date() }) {
  return async function handleAdminMetrics(request) {
    if (!request.auth?.uid) {
      throw new SupportPlanError('unauthenticated', 'Log in to view system metrics.')
    }

    if (
      !request.data ||
      typeof request.data !== 'object' ||
      Array.isArray(request.data) ||
      Object.keys(request.data).length
    ) {
      throw new SupportPlanError('invalid-argument', 'The metrics request must be empty.')
    }

    await requireAdmin(db, request.auth.uid)

    const generatedAt = now()

    if (!(generatedAt instanceof Date) || Number.isNaN(generatedAt.getTime())) {
      throw new Error('The metrics clock returned an invalid date.')
    }

    const [usersSnapshot, ratingsSnapshot, emailsSnapshot] = await Promise.all([
      db.collection('users').select('role').get(),
      db.collection('ratingAnalytics')
        .select('ratingCount', 'scoreTotal', 'scoreDistribution')
        .get(),
      db.collection('emailDispatches').select('dayKey', 'dailyCount', 'lastStatus').get(),
    ])

    return {
      generatedAt: generatedAt.toISOString(),
      users: summariseUsers(getDocuments(usersSnapshot)),
      ratings: summariseRatings(getDocuments(ratingsSnapshot)),
      emails: summariseEmails(getDocuments(emailsSnapshot), getUtcDayKey(generatedAt)),
    }
  }
}

module.exports = {
  createAdminMetricsHandler,
  safeCount,
  summariseEmails,
  summariseRatings,
  summariseUsers,
}
