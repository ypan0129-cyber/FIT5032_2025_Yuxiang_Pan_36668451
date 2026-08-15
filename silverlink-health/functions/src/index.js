const { cert, getApps, initializeApp } = require('firebase-admin/app')
const { getAuth } = require('firebase-admin/auth')
const { getFirestore, Timestamp } = require('firebase-admin/firestore')
const { createSendSupportPlanHandler } = require('./handler')
const {
  createRebuildRatingAnalyticsHandler,
  createSaveRatingHandler,
} = require('./ratingAnalytics')
const { createResendSender, SupportPlanError } = require('./supportPlan')

const DEFAULT_ALLOWED_ORIGINS = Object.freeze([
  'http://localhost:5173',
  'http://127.0.0.1:5173',
])
const ERROR_STATUS = Object.freeze({
  unauthenticated: 401,
  'permission-denied': 403,
  'invalid-argument': 400,
  'failed-precondition': 412,
  'resource-exhausted': 429,
  unavailable: 503,
  internal: 500,
})

let runtimeHandler

function getHeader(headers, name) {
  const target = name.toLowerCase()
  const entry = Object.entries(headers || {}).find(([key]) => key.toLowerCase() === target)

  return typeof entry?.[1] === 'string' ? entry[1].trim() : ''
}

function parseEvent(event) {
  const rawEvent = Buffer.isBuffer(event) ? event.toString('utf8') : event
  const envelope = typeof rawEvent === 'string' ? JSON.parse(rawEvent) : rawEvent

  if (!envelope || typeof envelope !== 'object' || Array.isArray(envelope)) {
    throw new SupportPlanError('invalid-argument', 'Enter a valid API request.')
  }

  return {
    body: envelope.body,
    headers: envelope.headers || {},
    isBase64Encoded: envelope.isBase64Encoded === true,
    method: String(
      envelope.requestContext?.http?.method || envelope.httpMethod || envelope.method || '',
    ).toUpperCase(),
    path: String(
      envelope.rawPath || envelope.requestContext?.http?.path || envelope.path || '/',
    ).replace(/\/+$/u, '') || '/',
  }
}

function parseRequestBody(body, isBase64Encoded) {
  if (body && typeof body === 'object' && !Buffer.isBuffer(body)) {
    return body
  }

  if (typeof body !== 'string') {
    throw new SupportPlanError('invalid-argument', 'Enter a valid API request.')
  }

  try {
    const decodedBody = isBase64Encoded
      ? Buffer.from(body, 'base64').toString('utf8')
      : body
    const payload = JSON.parse(decodedBody)

    if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
      throw new Error('Invalid JSON payload')
    }

    return payload
  } catch {
    throw new SupportPlanError('invalid-argument', 'Enter a valid API request.')
  }
}

function normaliseAllowedOrigins(value) {
  const origins = typeof value === 'string' && value.trim()
    ? value.split(',').map((origin) => origin.trim()).filter(Boolean)
    : [...DEFAULT_ALLOWED_ORIGINS]

  return new Set(
    origins.map((origin) => {
      const url = new URL(origin)

      if (!['http:', 'https:'].includes(url.protocol) || url.origin !== origin) {
        throw new Error('ALLOWED_ORIGINS must contain comma-separated HTTP origins.')
      }

      return url.origin
    }),
  )
}

function responseHeaders(origin, allowedOrigins) {
  const headers = {
    'Cache-Control': 'no-store',
    'Content-Type': 'application/json; charset=utf-8',
    'X-Content-Type-Options': 'nosniff',
  }

  if (origin && allowedOrigins.has(origin)) {
    headers['Access-Control-Allow-Origin'] = origin
    headers.Vary = 'Origin'
  }

  return headers
}

function jsonResponse(statusCode, payload, origin, allowedOrigins, extraHeaders = {}) {
  return {
    statusCode,
    headers: {
      ...responseHeaders(origin, allowedOrigins),
      ...extraHeaders,
    },
    isBase64Encoded: false,
    body: statusCode === 204 ? '' : JSON.stringify(payload),
  }
}

function mapHttpError(error) {
  if (error instanceof SupportPlanError) {
    return {
      statusCode: ERROR_STATUS[error.code] || 500,
      payload: { error: { code: error.code, message: error.message } },
    }
  }

  return {
    statusCode: 500,
    payload: {
      error: {
        code: 'internal',
        message: 'The request could not be completed. Try again later.',
      },
    },
  }
}

function createApiHttpHandler({
  verifyIdToken,
  handleSupportPlan,
  handleSaveRating,
  handleRebuildRatingAnalytics,
  allowedOrigins = DEFAULT_ALLOWED_ORIGINS.join(','),
  logger = console,
}) {
  const originAllowlist = normaliseAllowedOrigins(allowedOrigins)

  return async function handleHttpEvent(event) {
    let request
    let origin = ''
    let uid = ''

    try {
      request = parseEvent(event)
      origin = getHeader(request.headers, 'origin')

      if (origin && !originAllowlist.has(origin)) {
        throw new SupportPlanError('permission-denied', 'This website cannot use the API.')
      }

      if (request.method === 'OPTIONS') {
        return jsonResponse(204, null, origin, originAllowlist, {
          'Access-Control-Allow-Headers': 'Authorization, Content-Type',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Max-Age': '600',
        })
      }

      if (request.method !== 'POST') {
        return jsonResponse(
          405,
          { error: { code: 'method-not-allowed', message: 'Use POST for this endpoint.' } },
          origin,
          originAllowlist,
          { Allow: 'POST, OPTIONS' },
        )
      }

      const authorization = getHeader(request.headers, 'authorization')
      const match = /^Bearer ([A-Za-z0-9._~-]+)$/u.exec(authorization)

      if (!match || match[1].length > 8192) {
        throw new SupportPlanError('unauthenticated', 'Log in before using this service.')
      }

      let decodedToken

      try {
        decodedToken = await verifyIdToken(match[1])
      } catch {
        throw new SupportPlanError('unauthenticated', 'Log in again before using this service.')
      }

      uid = decodedToken?.uid || decodedToken?.sub || ''

      if (!uid) {
        throw new SupportPlanError('unauthenticated', 'Log in again before using this service.')
      }

      const data = parseRequestBody(request.body, request.isBase64Encoded)
      const authenticatedRequest = { auth: { uid, token: decodedToken }, data }
      let result

      if (request.path === '/' || request.path === '/support-plan') {
        result = await handleSupportPlan(authenticatedRequest)
      } else if (/^\/ratings\/[a-z0-9][a-z0-9-]*$/u.test(request.path)) {
        if (typeof handleSaveRating !== 'function') {
          return jsonResponse(
            404,
            { error: { code: 'not-found', message: 'This API route does not exist.' } },
            origin,
            originAllowlist,
          )
        }

        const resourceId = request.path.slice('/ratings/'.length)
        result = await handleSaveRating({
          ...authenticatedRequest,
          data: { ...data, resourceId },
        })
      } else if (request.path === '/rating-analytics/rebuild') {
        if (typeof handleRebuildRatingAnalytics !== 'function') {
          return jsonResponse(
            404,
            { error: { code: 'not-found', message: 'This API route does not exist.' } },
            origin,
            originAllowlist,
          )
        }

        result = await handleRebuildRatingAnalytics(authenticatedRequest)
      } else {
        return jsonResponse(
          404,
          { error: { code: 'not-found', message: 'This API route does not exist.' } },
          origin,
          originAllowlist,
        )
      }

      return jsonResponse(200, { data: result }, origin, originAllowlist)
    } catch (error) {
      const mapped = mapHttpError(error)

      if (!(error instanceof SupportPlanError)) {
        logger.error('API request failed.', {
          errorName: error?.name || 'Error',
          uid: uid || 'unauthenticated',
        })
      }

      return jsonResponse(mapped.statusCode, mapped.payload, origin, originAllowlist)
    }
  }
}

function createSupportPlanHttpHandler(options) {
  return createApiHttpHandler(options)
}

function getServiceAccount(environment) {
  let account

  if (environment.FIREBASE_SERVICE_ACCOUNT_JSON) {
    try {
      account = JSON.parse(environment.FIREBASE_SERVICE_ACCOUNT_JSON)
    } catch {
      throw new Error('FIREBASE_SERVICE_ACCOUNT_JSON is not valid JSON.')
    }
  } else {
    account = {
      project_id: environment.FIREBASE_PROJECT_ID,
      client_email: environment.FIREBASE_CLIENT_EMAIL,
      private_key: environment.FIREBASE_PRIVATE_KEY,
    }
  }

  if (!account || typeof account !== 'object' || Array.isArray(account)) {
    throw new Error('Firebase Admin credentials are not configured.')
  }

  const projectId = account.project_id || account.projectId
  const clientEmail = account.client_email || account.clientEmail
  const privateKey = account.private_key || account.privateKey

  if (
    typeof projectId !== 'string' || !projectId.trim() ||
    typeof clientEmail !== 'string' || !clientEmail.trim() ||
    typeof privateKey !== 'string' || !privateKey.trim()
  ) {
    throw new Error('Firebase Admin credentials are not configured.')
  }

  return {
    projectId: projectId.trim(),
    clientEmail: clientEmail.trim(),
    privateKey: privateKey.replaceAll('\\n', '\n'),
  }
}

function createRuntimeHandler(environment = process.env) {
  const serviceAccount = getServiceAccount(environment)
  const app = getApps()[0] || initializeApp({
    credential: cert(serviceAccount),
    projectId: serviceAccount.projectId,
  })
  const db = getFirestore(app)
  const auth = getAuth(app)
  const handleSupportPlan = createSendSupportPlanHandler({
    db,
    sendEmail: createResendSender({
      apiKey: environment.RESEND_API_KEY,
      fromAddress: environment.EMAIL_FROM || 'SilverLink Health <onboarding@resend.dev>',
    }),
    timestampFromDate: (date) => Timestamp.fromDate(date),
  })
  const ratingOptions = {
    db,
    createTimestamp: () => Timestamp.now(),
  }

  return createApiHttpHandler({
    verifyIdToken: (token) => auth.verifyIdToken(token, true),
    handleSupportPlan,
    handleSaveRating: createSaveRatingHandler(ratingOptions),
    handleRebuildRatingAnalytics: createRebuildRatingAnalyticsHandler(ratingOptions),
    allowedOrigins: environment.ALLOWED_ORIGINS,
  })
}

async function handler(event, context, callback) {
  let response

  try {
    runtimeHandler ||= createRuntimeHandler()
    response = await runtimeHandler(event)
  } catch (error) {
    console.error('API function could not start.', {
      errorName: error?.name || 'Error',
      requestId: context?.requestId || 'unknown',
    })
    response = {
      statusCode: 500,
      headers: {
        'Cache-Control': 'no-store',
        'Content-Type': 'application/json; charset=utf-8',
        'X-Content-Type-Options': 'nosniff',
      },
      isBase64Encoded: false,
      body: JSON.stringify({
        error: {
          code: 'internal',
          message: 'The API service is not configured.',
        },
      }),
    }
  }

  if (typeof callback === 'function') {
    callback(null, response)
    return undefined
  }

  return response
}

module.exports = {
  createApiHttpHandler,
  createRuntimeHandler,
  createSupportPlanHttpHandler,
  getServiceAccount,
  handler,
}
