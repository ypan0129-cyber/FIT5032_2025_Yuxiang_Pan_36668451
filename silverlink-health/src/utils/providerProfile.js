import { normaliseDisplayName } from './authValidation.js'
import { containsUnsafeMarkup } from './security.js'

const fallbackDisplayName = 'SilverLink member'
const minimumDisplayNameLength = 2
const maximumDisplayNameLength = 80

function isValidDisplayName(value) {
  return (
    value.length >= minimumDisplayNameLength &&
    value.length <= maximumDisplayNameLength &&
    !containsUnsafeMarkup(value)
  )
}

function getEmailPrefix(email) {
  if (typeof email !== 'string') return ''
  return email.split('@', 1)[0]
}

export function getProviderDisplayName(user = {}) {
  const candidates = [user.displayName, getEmailPrefix(user.email)]

  for (const candidate of candidates) {
    const displayName = normaliseDisplayName(candidate)

    if (isValidDisplayName(displayName)) {
      return displayName
    }
  }

  return fallbackDisplayName
}

export function createProviderMemberProfile(user, createdAt) {
  return {
    displayName: getProviderDisplayName(user),
    role: 'member',
    createdAt,
  }
}

export function getSignInMethodLabel(providerData = []) {
  const providerIds = new Set(
    Array.isArray(providerData)
      ? providerData.map((provider) => provider?.providerId).filter(Boolean)
      : [],
  )
  const methods = []

  if (providerIds.has('google.com')) methods.push('Google')
  if (providerIds.has('password')) methods.push('Email and password')

  return methods.length ? methods.join(' / ') : 'Firebase Authentication'
}
