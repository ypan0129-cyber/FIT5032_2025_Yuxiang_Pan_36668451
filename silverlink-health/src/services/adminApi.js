export function createAdminApiError(code, message) {
  const error = new Error(message || 'The administration request failed.')
  error.code = `admin/${code || 'internal'}`
  return error
}

function getSafeApiBaseUrl(apiUrl) {
  try {
    const url = new URL(apiUrl)
    const isLocalHttp =
      url.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(url.hostname)

    if ((url.protocol !== 'https:' && !isLocalHttp) || url.username || url.password) {
      throw new Error('Unsafe administration API URL')
    }

    url.search = ''
    url.hash = ''
    url.pathname = `${url.pathname.replace(/\/+$/u, '')}/`
    return url
  } catch {
    throw createAdminApiError('not-configured', 'Administration metrics are not configured.')
  }
}

function isRecord(value) {
  return value && typeof value === 'object' && !Array.isArray(value)
}

function isCount(value) {
  return Number.isSafeInteger(value) && value >= 0
}

function normaliseAdminMetrics(data) {
  if (!isRecord(data) || !isRecord(data.users) || !isRecord(data.users.roles)) {
    throw createAdminApiError('unavailable', 'The metrics service returned an invalid response.')
  }

  if (!isRecord(data.ratings) || !isRecord(data.emails) || !isRecord(data.emails.latestStatuses)) {
    throw createAdminApiError('unavailable', 'The metrics service returned an invalid response.')
  }

  const generatedAt = new Date(data.generatedAt)
  const roles = data.users.roles
  const statuses = data.emails.latestStatuses
  const roleCounts = [roles.member, roles.staff, roles.admin, roles.other]
  const statusCounts = [statuses.sent, statuses.failed, statuses.pending, statuses.other]
  const averageScore = data.ratings.averageScore

  const valid =
    typeof data.generatedAt === 'string' &&
    !Number.isNaN(generatedAt.getTime()) &&
    isCount(data.users.total) &&
    roleCounts.every(isCount) &&
    roleCounts.reduce((total, count) => total + count, 0) === data.users.total &&
    isCount(data.ratings.totalRatings) &&
    isCount(data.ratings.ratedResources) &&
    isCount(data.ratings.resourceCount) &&
    data.ratings.ratedResources <= data.ratings.resourceCount &&
    (
      (data.ratings.totalRatings === 0 && averageScore === null) ||
      (
        data.ratings.totalRatings > 0 &&
        typeof averageScore === 'number' &&
        Number.isFinite(averageScore) &&
        averageScore >= 1 &&
        averageScore <= 5
      )
    ) &&
    isCount(data.emails.attemptsToday) &&
    isCount(data.emails.trackedAccounts) &&
    statusCounts.every(isCount) &&
    statusCounts.reduce((total, count) => total + count, 0) === data.emails.trackedAccounts

  if (!valid) {
    throw createAdminApiError('unavailable', 'The metrics service returned an invalid response.')
  }

  return {
    generatedAt: data.generatedAt,
    users: {
      total: data.users.total,
      roles: {
        member: roles.member,
        staff: roles.staff,
        admin: roles.admin,
        other: roles.other,
      },
    },
    ratings: {
      totalRatings: data.ratings.totalRatings,
      ratedResources: data.ratings.ratedResources,
      resourceCount: data.ratings.resourceCount,
      averageScore,
    },
    emails: {
      attemptsToday: data.emails.attemptsToday,
      trackedAccounts: data.emails.trackedAccounts,
      latestStatuses: {
        sent: statuses.sent,
        failed: statuses.failed,
        pending: statuses.pending,
        other: statuses.other,
      },
    },
  }
}

async function readJsonResponse(response) {
  try {
    return await response.json()
  } catch {
    throw createAdminApiError('unavailable', 'The metrics service returned an invalid response.')
  }
}

export function createAdminMetricsLoader({
  apiUrl,
  getIdToken,
  fetchImplementation = fetch,
}) {
  return async function loadAdminMetrics() {
    if (!apiUrl) {
      throw createAdminApiError('not-configured', 'Administration metrics are not configured.')
    }

    const endpoint = new URL('admin/metrics', getSafeApiBaseUrl(apiUrl))
    let token

    try {
      token = await getIdToken()
    } catch {
      throw createAdminApiError('unauthenticated', 'Log in again to view system metrics.')
    }

    if (typeof token !== 'string' || !token) {
      throw createAdminApiError('unauthenticated', 'Log in again to view system metrics.')
    }

    let response

    try {
      response = await fetchImplementation(endpoint, {
        method: 'POST',
        credentials: 'omit',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      })
    } catch {
      throw createAdminApiError('unavailable', 'The metrics service could not be reached.')
    }

    const result = await readJsonResponse(response)

    if (!response.ok) {
      throw createAdminApiError(result?.error?.code, result?.error?.message)
    }

    return normaliseAdminMetrics(result?.data)
  }
}

export { normaliseAdminMetrics }
