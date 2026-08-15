export function createSupportPlanApiError(code, message) {
  const error = new Error(message || 'The support plan request failed.')
  error.code = `support-plan/${code || 'internal'}`
  return error
}

function getSafeApiUrl(apiUrl) {
  try {
    const url = new URL(apiUrl)
    const isLocalHttp =
      url.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(url.hostname)

    if ((url.protocol !== 'https:' && !isLocalHttp) || url.username || url.password) {
      throw new Error('Unsafe support plan API URL')
    }

    return url.toString()
  } catch {
    throw createSupportPlanApiError('not-configured', 'The support plan service is not configured.')
  }
}

async function readJsonResponse(response) {
  try {
    return await response.json()
  } catch {
    throw createSupportPlanApiError(
      'unavailable',
      'The support plan service returned an invalid response.',
    )
  }
}

export function createSupportPlanSender({ apiUrl, getIdToken, fetchImplementation = fetch }) {
  return async function sendPlan(payload) {
    if (!apiUrl) {
      throw createSupportPlanApiError(
        'not-configured',
        'The support plan service is not configured.',
      )
    }

    const endpoint = getSafeApiUrl(apiUrl)
    const token = await getIdToken()
    let response

    if (typeof token !== 'string' || !token) {
      throw createSupportPlanApiError('unauthenticated', 'Log in before sending a support plan.')
    }

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
      throw createSupportPlanApiError(
        'unavailable',
        'The support plan service could not be reached.',
      )
    }

    const result = await readJsonResponse(response)

    if (!response.ok) {
      throw createSupportPlanApiError(result?.error?.code, result?.error?.message)
    }

    if (!result?.data || typeof result.data !== 'object') {
      throw createSupportPlanApiError(
        'unavailable',
        'The support plan service returned an invalid response.',
      )
    }

    return result.data
  }
}
