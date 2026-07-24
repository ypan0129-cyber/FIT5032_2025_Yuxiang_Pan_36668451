import { containsUnsafeMarkup } from './security.js'

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const maximumEmailLength = 254
const maximumPasswordLength = 64

function asString(value) {
  return typeof value === 'string' ? value : ''
}

export function normaliseDisplayName(value) {
  return asString(value).trim().replace(/\s+/g, ' ')
}

export function validateLogin(values = {}) {
  const errors = {}
  const email = asString(values.email).trim()
  const password = asString(values.password)

  if (!email) {
    errors.email = 'Enter your email address.'
  } else if (email.length > maximumEmailLength) {
    errors.email = 'Email address must contain no more than 254 characters.'
  } else if (!emailPattern.test(email)) {
    errors.email = 'Enter a valid email address.'
  }

  if (!password) {
    errors.password = 'Enter your password.'
  } else if (password.length > maximumPasswordLength) {
    errors.password = 'Password must contain no more than 64 characters.'
  }

  return errors
}

export function validateRegistration(values = {}) {
  const errors = {}
  const displayName = normaliseDisplayName(values.displayName)
  const email = asString(values.email).trim()
  const password = asString(values.password)
  const confirmPassword = asString(values.confirmPassword)

  if (!displayName) {
    errors.displayName = 'Enter your full name.'
  } else if (containsUnsafeMarkup(displayName)) {
    errors.displayName = 'Name cannot contain < or > characters.'
  } else if (displayName.length < 2) {
    errors.displayName = 'Name must contain at least 2 characters.'
  } else if (displayName.length > 80) {
    errors.displayName = 'Name must contain no more than 80 characters.'
  }

  if (!email) {
    errors.email = 'Enter your email address.'
  } else if (email.length > maximumEmailLength) {
    errors.email = 'Email address must contain no more than 254 characters.'
  } else if (!emailPattern.test(email)) {
    errors.email = 'Enter a valid email address.'
  }

  if (!password) {
    errors.password = 'Create a password.'
  } else if (password.length < 8) {
    errors.password = 'Password must contain at least 8 characters.'
  } else if (password.length > maximumPasswordLength) {
    errors.password = 'Password must contain no more than 64 characters.'
  }

  if (!confirmPassword) {
    errors.confirmPassword = 'Enter the password again.'
  } else if (password !== confirmPassword) {
    errors.confirmPassword = 'Passwords do not match.'
  }

  return errors
}
