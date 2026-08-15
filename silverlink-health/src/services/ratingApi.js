export function createRatingApiError(code, message) {
  const error = new Error(message || 'The rating request failed.')
  error.code = `rating/${code || 'internal'}`
  return error
}

function getSafeApiBaseUrl(apiUrl) {
  try {
    const url = new URL(apiUrl)
    const isLocalHttp =
      url.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(url.hostname)

    if ((url.protocol !== 'https:' && !isLocalHttp) || url.username || url.password) {
      throw new Error('Unsafe rating API URL')
    }

    url.search = ''
    url.hash = ''
    url.pathname = `${url.pathname.replace(/\/+$/u, '')}/`
    return url
  } catch {
    throw createRatingApiError('not-configured', 'The rating service is not configured.')
  }
}

async function readJsonResponse(response) {
  try {
    return await response.json()
  } catch {
    throw createRatingApiError('unavailable', 'The rating service returned an invalid response.')
  }
}

function createAuthenticatedPost({ apiUrl, getIdToken, fetchImplementation }) {
  return async function post(path, payload) {
    if (!apiUrl) {
      throw createRatingApiError('not-configured', 'The rating service is not configured.')
    }

    const baseUrl = getSafeApiBaseUrl(apiUrl)
    const endpoint = new URL(path, baseUrl)
    const token = await getIdToken()

    if (typeof token !== 'string' || !token) {
      throw createRatingApiError('unauthenticated', 'Log in to submit a rating.')
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
        body: JSON.stringify(payload),
      })
    } catch {
      throw createRatingApiError('unavailable', 'The rating service could not be reached.')
    }

    const result = await readJsonResponse(response)

    if (!response.ok) {
      throw createRatingApiError(result?.error?.code, result?.error?.message)
    }

    if (!result?.data || typeof result.data !== 'object') {
      throw createRatingApiError('unavailable', 'The rating service returned an invalid response.')
    }

    return result.data
  }
}

export function createRatingSaver({ apiUrl, getIdToken, fetchImplementation = fetch }) {
  const post = createAuthenticatedPost({ apiUrl, getIdToken, fetchImplementation })

  return (resourceId, score) =>
    post(`ratings/${encodeURIComponent(resourceId)}`, { score })
}

export function createRatingAnalyticsRebuilder({
  apiUrl,
  getIdToken,
  fetchImplementation = fetch,
}) {
  const post = createAuthenticatedPost({ apiUrl, getIdToken, fetchImplementation })

  return () => post('rating-analytics/rebuild', {})
}
