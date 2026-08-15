const { SupportPlanError } = require('./supportPlan')

const RESOURCE_IDS = Object.freeze([
  'lifeline-australia',
  'beyond-blue',
  'head-to-health',
  'friendline',
  'grief-australia',
  'sleep-health-foundation',
])
const RESOURCE_ID_SET = new Set(RESOURCE_IDS)
const MIN_SCORE = 1
const MAX_SCORE = 5

function emptyDistribution() {
  return Object.fromEntries(
    Array.from({ length: MAX_SCORE }, (_, index) => [String(index + 1), 0]),
  )
}

function isValidScore(score) {
  return Number.isInteger(score) && score >= MIN_SCORE && score <= MAX_SCORE
}

function validateRatingPayload(data) {
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    throw new SupportPlanError('invalid-argument', 'Choose a rating from 1 to 5.')
  }

  const keys = Object.keys(data)
  const resourceId = data.resourceId
  const score = data.score

  if (keys.some((key) => !['resourceId', 'score'].includes(key))) {
    throw new SupportPlanError('invalid-argument', 'The rating request contains unsupported fields.')
  }

  if (typeof resourceId !== 'string' || !RESOURCE_ID_SET.has(resourceId)) {
    throw new SupportPlanError('invalid-argument', 'This resource cannot receive a rating.')
  }

  if (!isValidScore(score)) {
    throw new SupportPlanError('invalid-argument', 'Choose a rating from 1 to 5.')
  }

  return { resourceId, score }
}

function buildAggregate(ratingSnapshots) {
  const distribution = emptyDistribution()
  let ratingCount = 0
  let scoreTotal = 0

  for (const snapshot of ratingSnapshots) {
    const score = snapshot.data()?.score

    if (!isValidScore(score)) {
      continue
    }

    ratingCount += 1
    scoreTotal += score
    distribution[String(score)] += 1
  }

  return {
    ratingCount,
    scoreTotal,
    averageScore: ratingCount ? scoreTotal / ratingCount : null,
    scoreDistribution: distribution,
  }
}

function normaliseAggregate(data) {
  if (!data || typeof data !== 'object') {
    return null
  }

  const { ratingCount, scoreTotal, scoreDistribution } = data

  if (
    !Number.isInteger(ratingCount) || ratingCount < 0 ||
    !Number.isInteger(scoreTotal) || scoreTotal < 0 ||
    !scoreDistribution || typeof scoreDistribution !== 'object'
  ) {
    return null
  }

  const distribution = emptyDistribution()
  let distributionCount = 0
  let distributionTotal = 0

  for (let score = MIN_SCORE; score <= MAX_SCORE; score += 1) {
    const count = scoreDistribution[String(score)]

    if (!Number.isInteger(count) || count < 0) {
      return null
    }

    distribution[String(score)] = count
    distributionCount += count
    distributionTotal += count * score
  }

  if (distributionCount !== ratingCount || distributionTotal !== scoreTotal) {
    return null
  }

  return {
    ratingCount,
    scoreTotal,
    averageScore: ratingCount ? scoreTotal / ratingCount : null,
    scoreDistribution: distribution,
  }
}

async function requireRole(db, uid, role) {
  const profileSnapshot = await db.collection('users').doc(uid).get()
  const profile = profileSnapshot.exists ? profileSnapshot.data() : null

  if (profile?.role !== role) {
    throw new SupportPlanError(
      'permission-denied',
      `Only ${role} accounts can perform this operation.`,
    )
  }
}

function createSaveRatingHandler({ db, createTimestamp }) {
  return async function handleSaveRating(request) {
    if (!request.auth?.uid) {
      throw new SupportPlanError('unauthenticated', 'Log in to submit a rating.')
    }

    const { resourceId, score } = validateRatingPayload(request.data)
    await requireRole(db, request.auth.uid, 'member')

    const ratings = db.collection('resources').doc(resourceId).collection('ratings')
    const ratingReference = ratings.doc(request.auth.uid)
    const aggregateReference = db.collection('ratingAnalytics').doc(resourceId)
    const timestamp = createTimestamp()

    return db.runTransaction(async (transaction) => {
      const [ratingSnapshot, aggregateSnapshot] = await Promise.all([
        transaction.get(ratingReference),
        transaction.get(aggregateReference),
      ])
      const existingScore = ratingSnapshot.exists ? ratingSnapshot.data()?.score : null

      if (ratingSnapshot.exists && !isValidScore(existingScore)) {
        throw new SupportPlanError(
          'failed-precondition',
          'This saved rating is incomplete. Please contact support.',
        )
      }

      let aggregate = normaliseAggregate(
        aggregateSnapshot.exists ? aggregateSnapshot.data() : null,
      )

      if (!aggregate) {
        const ratingQuerySnapshot = await transaction.get(ratings)
        aggregate = buildAggregate(ratingQuerySnapshot.docs)
      }

      if (ratingSnapshot.exists) {
        aggregate.scoreTotal += score - existingScore
        aggregate.scoreDistribution[String(existingScore)] -= 1
      } else {
        aggregate.ratingCount += 1
        aggregate.scoreTotal += score
      }

      aggregate.scoreDistribution[String(score)] += 1
      aggregate.averageScore = aggregate.scoreTotal / aggregate.ratingCount

      transaction.set(ratingReference, {
        score,
        createdAt: ratingSnapshot.exists ? ratingSnapshot.data().createdAt : timestamp,
        updatedAt: timestamp,
      })
      transaction.set(aggregateReference, {
        ...aggregate,
        updatedAt: timestamp,
      })

      return {
        score,
        isNew: !ratingSnapshot.exists,
        summary: {
          averageScore: aggregate.averageScore,
          ratingCount: aggregate.ratingCount,
          scoreDistribution: aggregate.scoreDistribution,
        },
      }
    })
  }
}

function createRebuildRatingAnalyticsHandler({ db, createTimestamp }) {
  return async function handleRebuildRatingAnalytics(request) {
    if (!request.auth?.uid) {
      throw new SupportPlanError('unauthenticated', 'Log in to rebuild rating analytics.')
    }

    await requireRole(db, request.auth.uid, 'staff')
    const summaries = []

    for (const resourceId of RESOURCE_IDS) {
      const ratings = db.collection('resources').doc(resourceId).collection('ratings')
      const aggregateReference = db.collection('ratingAnalytics').doc(resourceId)
      const summary = await db.runTransaction(async (transaction) => {
        const ratingQuerySnapshot = await transaction.get(ratings)
        const aggregate = buildAggregate(ratingQuerySnapshot.docs)

        transaction.set(aggregateReference, {
          ...aggregate,
          updatedAt: createTimestamp(),
        })

        return aggregate
      })

      summaries.push({
        resourceId,
        averageScore: summary.averageScore,
        ratingCount: summary.ratingCount,
      })
    }

    return { rebuilt: summaries.length, summaries }
  }
}

module.exports = {
  RESOURCE_IDS,
  buildAggregate,
  createRebuildRatingAnalyticsHandler,
  createSaveRatingHandler,
  normaliseAggregate,
  validateRatingPayload,
}
