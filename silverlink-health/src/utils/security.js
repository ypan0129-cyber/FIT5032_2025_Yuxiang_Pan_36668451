const redirectBaseUrl = 'https://silverlink-health.invalid'

/**
 * User profile names are stored and displayed as plain text. Vue escapes text
 * interpolation by default; rejecting markup delimiters adds another clear
 * validation boundary before the value reaches Firestore.
 */
export function containsUnsafeMarkup(value) {
  return typeof value === 'string' && /[<>]/u.test(value)
}

/**
 * Convert a login redirect into a same-origin route. URL parsing also rejects
 * protocol-relative and backslash-based external redirects that a simple
 * startsWith('/') check can miss.
 */
export function getSafeRedirectTarget(value, fallback = '/account') {
  if (typeof value !== 'string' || !value.startsWith('/')) {
    return fallback
  }

  try {
    const candidate = new URL(value, redirectBaseUrl)

    if (candidate.origin !== redirectBaseUrl) {
      return fallback
    }

    return `${candidate.pathname}${candidate.search}${candidate.hash}`
  } catch {
    return fallback
  }
}
