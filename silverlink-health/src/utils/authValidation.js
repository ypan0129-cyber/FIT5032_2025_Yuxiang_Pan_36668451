const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function normaliseDisplayName(value) {
  return value.trim().replace(/\s+/g, ' ')
}

export function validateLogin(values) {
  const errors = {}
  const email = values.email.trim()

  if (!email) {
    errors.email = 'Enter your email address.'
  } else if (!emailPattern.test(email)) {
    errors.email = 'Enter a valid email address.'
  }

  if (!values.password) {
    errors.password = 'Enter your password.'
  }

  return errors
}

export function validateRegistration(values) {
  const errors = {}
  const displayName = normaliseDisplayName(values.displayName)
  const email = values.email.trim()

  if (!displayName) {
    errors.displayName = 'Enter your full name.'
  } else if (displayName.length < 2) {
    errors.displayName = 'Name must contain at least 2 characters.'
  } else if (displayName.length > 80) {
    errors.displayName = 'Name must contain no more than 80 characters.'
  }

  if (!email) {
    errors.email = 'Enter your email address.'
  } else if (!emailPattern.test(email)) {
    errors.email = 'Enter a valid email address.'
  }

  if (!values.password) {
    errors.password = 'Create a password.'
  } else if (values.password.length < 8) {
    errors.password = 'Password must contain at least 8 characters.'
  } else if (values.password.length > 64) {
    errors.password = 'Password must contain no more than 64 characters.'
  }

  if (!values.confirmPassword) {
    errors.confirmPassword = 'Enter the password again.'
  } else if (values.password !== values.confirmPassword) {
    errors.confirmPassword = 'Passwords do not match.'
  }

  return errors
}
