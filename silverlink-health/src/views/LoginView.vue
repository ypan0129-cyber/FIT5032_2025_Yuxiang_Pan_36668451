<script setup>
import { LogIn } from '@lucide/vue'
import { reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getAuthErrorMessage, signIn } from '../auth'
import GoogleSignInButton from '../components/GoogleSignInButton.vue'
import { isFirebaseConfigured } from '../firebase'
import { validateLogin } from '../utils/authValidation'
import { getSafeRedirectTarget } from '../utils/security'

const email = ref('')
const password = ref('')
const formError = ref('')
const isSubmitting = ref(false)
const isGoogleSigningIn = ref(false)
const fieldErrors = reactive({
  email: '',
  password: '',
})
const route = useRoute()
const router = useRouter()

function clearErrors() {
  fieldErrors.email = ''
  fieldErrors.password = ''
  formError.value = ''
}

function getRedirectTarget() {
  return getSafeRedirectTarget(route.query.redirect)
}

async function submitForm() {
  clearErrors()
  const errors = validateLogin({ email: email.value, password: password.value })

  if (Object.keys(errors).length) {
    Object.assign(fieldErrors, errors)
    formError.value = 'Check the highlighted fields and try again.'
    return
  }

  isSubmitting.value = true

  try {
    await signIn(email.value, password.value)
    await router.replace(getRedirectTarget())
  } catch (error) {
    formError.value = getAuthErrorMessage(error)
  } finally {
    isSubmitting.value = false
  }
}

async function handleGoogleSuccess() {
  clearErrors()
  await router.replace(getRedirectTarget())
}

function handleGoogleError(error) {
  clearErrors()
  formError.value = getAuthErrorMessage(error)
}
</script>

<template>
  <section class="auth-page">
    <div class="auth-panel">
      <div class="auth-panel__heading">
        <p class="eyebrow">Member access</p>
        <h1>Log in</h1>
        <p>Access your saved account and resource ratings.</p>
      </div>

      <p v-if="!isFirebaseConfigured" class="form-notice form-notice--error" role="alert">
        Account access is not configured for this environment.
      </p>

      <GoogleSignInButton
        :disabled="isSubmitting || !isFirebaseConfigured"
        @busy-change="isGoogleSigningIn = $event"
        @error="handleGoogleError"
        @success="handleGoogleSuccess"
      />

      <div class="auth-divider" role="separator" aria-label="Or use email and password">
        <span>or use email and password</span>
      </div>

      <form class="form-stack" novalidate @submit.prevent="submitForm">
        <div class="form-field">
          <label for="login-email">Email address</label>
          <input
            id="login-email"
            v-model.trim="email"
            type="email"
            autocomplete="email"
            maxlength="254"
            :aria-describedby="fieldErrors.email ? 'login-email-error' : undefined"
            :aria-invalid="Boolean(fieldErrors.email)"
            required
          />
          <p v-if="fieldErrors.email" id="login-email-error" class="field-error">
            {{ fieldErrors.email }}
          </p>
        </div>
        <div class="form-field">
          <label for="login-password">Password</label>
          <input
            id="login-password"
            v-model="password"
            type="password"
            autocomplete="current-password"
            maxlength="64"
            :aria-describedby="fieldErrors.password ? 'login-password-error' : undefined"
            :aria-invalid="Boolean(fieldErrors.password)"
            required
          />
          <p v-if="fieldErrors.password" id="login-password-error" class="field-error">
            {{ fieldErrors.password }}
          </p>
        </div>
        <button
          class="button button--primary button--full"
          type="submit"
          :disabled="isSubmitting || isGoogleSigningIn || !isFirebaseConfigured"
        >
          <LogIn :size="19" aria-hidden="true" />
          {{ isSubmitting ? 'Logging in...' : 'Log in' }}
        </button>
      </form>

      <p v-if="formError" class="form-notice form-notice--error auth-error" role="alert">
        {{ formError }}
      </p>

      <p class="auth-panel__switch">
        New to SilverLink Health?
        <RouterLink to="/register">Create an account</RouterLink>
      </p>
    </div>
  </section>
</template>
