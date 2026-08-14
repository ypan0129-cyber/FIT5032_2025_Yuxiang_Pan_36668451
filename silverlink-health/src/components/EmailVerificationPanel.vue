<script setup>
import { MailCheck, RefreshCw, Send } from '@lucide/vue'
import { computed, ref } from 'vue'
import {
  getAuthErrorMessage,
  refreshCurrentUser,
  sendAccountVerificationEmail,
  useAuth,
} from '../auth'

defineProps({
  showPlanLink: {
    type: Boolean,
    default: true,
  },
})

const authState = useAuth()
const isSending = ref(false)
const isChecking = ref(false)
const statusMessage = ref('')
const errorMessage = ref('')
const isVerified = computed(() => Boolean(authState.user?.emailVerified))

function clearMessages() {
  statusMessage.value = ''
  errorMessage.value = ''
}

async function sendVerification() {
  clearMessages()
  isSending.value = true

  try {
    await sendAccountVerificationEmail()
    statusMessage.value = `Verification email sent to ${authState.user?.email}.`
  } catch (error) {
    errorMessage.value = getAuthErrorMessage(error)
  } finally {
    isSending.value = false
  }
}

async function checkVerification() {
  clearMessages()
  isChecking.value = true

  try {
    const user = await refreshCurrentUser()
    statusMessage.value = user?.emailVerified
      ? 'Your email address is verified.'
      : 'Your email is not verified yet. Open the verification link, then check again.'
  } catch (error) {
    errorMessage.value = getAuthErrorMessage(error)
  } finally {
    isChecking.value = false
  }
}
</script>

<template>
  <section class="verification-block" aria-labelledby="email-verification-title">
    <div class="verification-block__heading">
      <MailCheck :size="24" aria-hidden="true" />
      <div>
        <p class="eyebrow">Email verification</p>
        <h2 id="email-verification-title">
          {{ isVerified ? 'Email verified' : 'Verify your email first' }}
        </h2>
      </div>
    </div>

    <p v-if="isVerified">
      Support plans can be sent only to your verified account address.
    </p>
    <p v-else>
      Open the verification link sent by Firebase before emailing a support plan.
    </p>

    <div class="button-row verification-block__actions">
      <RouterLink v-if="isVerified && showPlanLink" class="button button--primary" to="/support-plan">
        <Send :size="18" aria-hidden="true" />
        Create support plan
      </RouterLink>
      <template v-if="!isVerified">
        <button
          class="button button--secondary"
          type="button"
          :disabled="isSending || isChecking"
          @click="sendVerification"
        >
          <Send :size="18" aria-hidden="true" />
          {{ isSending ? 'Sending...' : 'Send verification email' }}
        </button>
        <button
          class="button button--quiet"
          type="button"
          :disabled="isSending || isChecking"
          @click="checkVerification"
        >
          <RefreshCw :size="18" aria-hidden="true" />
          {{ isChecking ? 'Checking...' : 'Check verification' }}
        </button>
      </template>
    </div>

    <p v-if="statusMessage" class="form-notice" role="status">{{ statusMessage }}</p>
    <p v-if="errorMessage" class="form-notice form-notice--error" role="alert">
      {{ errorMessage }}
    </p>
  </section>
</template>
