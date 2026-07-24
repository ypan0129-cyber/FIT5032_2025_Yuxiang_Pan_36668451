<script setup>
import { UserPlus } from '@lucide/vue'
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { getAuthErrorMessage, registerMember } from '../auth'
import { isFirebaseConfigured } from '../firebase'
import { normaliseDisplayName, validateRegistration } from '../utils/authValidation'

const form = reactive({
  displayName: '',
  email: '',
  password: '',
  confirmPassword: '',
})
const fieldErrors = reactive({
  displayName: '',
  email: '',
  password: '',
  confirmPassword: '',
})
const formError = ref('')
const isSubmitting = ref(false)
const router = useRouter()

function clearErrors() {
  Object.keys(fieldErrors).forEach((field) => {
    fieldErrors[field] = ''
  })
  formError.value = ''
}

async function submitForm() {
  clearErrors()
  const errors = validateRegistration(form)

  if (Object.keys(errors).length) {
    Object.assign(fieldErrors, errors)
    formError.value = 'Check the highlighted fields and try again.'
    return
  }

  isSubmitting.value = true

  try {
    await registerMember({
      displayName: normaliseDisplayName(form.displayName),
      email: form.email,
      password: form.password,
    })
    await router.replace('/account')
  } catch (error) {
    formError.value = getAuthErrorMessage(error)
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <section class="auth-page">
    <div class="auth-panel auth-panel--wide">
      <div class="auth-panel__heading">
        <p class="eyebrow">Free member account</p>
        <h1>Create an account</h1>
        <p>Register to rate services and keep track of your feedback.</p>
      </div>

      <form class="form-stack" novalidate @submit.prevent="submitForm">
        <p v-if="!isFirebaseConfigured" class="form-notice form-notice--error" role="alert">
          Account access is not configured for this environment.
        </p>
        <div class="form-field">
          <label for="register-name">Full name</label>
          <input
            id="register-name"
            v-model="form.displayName"
            type="text"
            autocomplete="name"
            maxlength="80"
            :aria-describedby="fieldErrors.displayName ? 'register-name-error' : undefined"
            :aria-invalid="Boolean(fieldErrors.displayName)"
            required
          />
          <p v-if="fieldErrors.displayName" id="register-name-error" class="field-error">
            {{ fieldErrors.displayName }}
          </p>
        </div>
        <div class="form-field">
          <label for="register-email">Email address</label>
          <input
            id="register-email"
            v-model.trim="form.email"
            type="email"
            autocomplete="email"
            maxlength="254"
            :aria-describedby="fieldErrors.email ? 'register-email-error' : undefined"
            :aria-invalid="Boolean(fieldErrors.email)"
            required
          />
          <p v-if="fieldErrors.email" id="register-email-error" class="field-error">
            {{ fieldErrors.email }}
          </p>
        </div>
        <div class="form-field">
          <label for="register-password">Password</label>
          <input
            id="register-password"
            v-model="form.password"
            type="password"
            autocomplete="new-password"
            minlength="8"
            maxlength="64"
            :aria-describedby="
              fieldErrors.password ? 'register-password-hint register-password-error' : 'register-password-hint'
            "
            :aria-invalid="Boolean(fieldErrors.password)"
            required
          />
          <p id="register-password-hint" class="field-hint">Use 8 to 64 characters.</p>
          <p v-if="fieldErrors.password" id="register-password-error" class="field-error">
            {{ fieldErrors.password }}
          </p>
        </div>
        <div class="form-field">
          <label for="register-confirm">Confirm password</label>
          <input
            id="register-confirm"
            v-model="form.confirmPassword"
            type="password"
            autocomplete="new-password"
            minlength="8"
            maxlength="64"
            :aria-describedby="
              fieldErrors.confirmPassword ? 'register-confirm-error' : undefined
            "
            :aria-invalid="Boolean(fieldErrors.confirmPassword)"
            required
          />
          <p v-if="fieldErrors.confirmPassword" id="register-confirm-error" class="field-error">
            {{ fieldErrors.confirmPassword }}
          </p>
        </div>
        <button
          class="button button--primary button--full"
          type="submit"
          :disabled="isSubmitting || !isFirebaseConfigured"
        >
          <UserPlus :size="19" aria-hidden="true" />
          {{ isSubmitting ? 'Creating account...' : 'Create account' }}
        </button>
        <p v-if="formError" class="form-notice form-notice--error" role="alert">
          {{ formError }}
        </p>
      </form>

      <p class="auth-panel__switch">
        Already have an account?
        <RouterLink to="/login">Log in</RouterLink>
      </p>
    </div>
  </section>
</template>
