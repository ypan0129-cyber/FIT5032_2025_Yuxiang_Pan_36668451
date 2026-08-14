<script setup>
import { FileText, LockKeyhole, Send } from '@lucide/vue'
import { computed, reactive, ref } from 'vue'
import { getAuthErrorMessage, refreshCurrentUser, useAuth } from '../auth'
import EmailVerificationPanel from '../components/EmailVerificationPanel.vue'
import { resources } from '../data/resources'
import { sendSupportPlan } from '../services/supportPlanService'
import {
  maxSupportPlanNotesLength,
  maxSupportPlanResources,
  normaliseSupportPlan,
  supportPlanContactPreferences,
  validateSupportPlan,
} from '../utils/supportPlan'

const authState = useAuth()
const form = reactive({
  resourceIds: [],
  contactPreference: 'Phone',
  notes: '',
})
const fieldErrors = reactive({
  resourceIds: '',
  contactPreference: '',
  notes: '',
})
const formError = ref('')
const successMessage = ref('')
const isSubmitting = ref(false)
const isEmailVerified = computed(() => Boolean(authState.user?.emailVerified))
const selectedCount = computed(() => form.resourceIds.length)

function clearMessages() {
  Object.keys(fieldErrors).forEach((field) => {
    fieldErrors[field] = ''
  })
  formError.value = ''
  successMessage.value = ''
}

function isResourceDisabled(resourceId) {
  return (
    isSubmitting.value ||
    (selectedCount.value >= maxSupportPlanResources && !form.resourceIds.includes(resourceId))
  )
}

async function submitPlan() {
  clearMessages()
  const errors = validateSupportPlan(form)

  if (Object.keys(errors).length) {
    Object.assign(fieldErrors, errors)
    formError.value = 'Check the highlighted fields and try again.'
    return
  }

  if (!isEmailVerified.value) {
    formError.value = 'Verify your email address before sending a support plan.'
    return
  }

  isSubmitting.value = true

  try {
    const refreshedUser = await refreshCurrentUser()

    if (!refreshedUser?.emailVerified) {
      formError.value = 'Verify your email address before sending a support plan.'
      return
    }

    const result = await sendSupportPlan(normaliseSupportPlan(form))
    successMessage.value = `Your support plan and PDF attachment were sent to ${result.recipient}.`
  } catch (error) {
    formError.value = getAuthErrorMessage(error)
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <section class="page-intro">
    <div class="site-container page-intro__inner">
      <p class="eyebrow">Member support plan</p>
      <h1>Email your support plan</h1>
      <p>Select trusted services and receive a personal PDF at your verified account email.</p>
    </div>
  </section>

  <section class="section section--compact">
    <div class="site-container support-plan-layout">
      <article class="support-plan-panel" aria-labelledby="support-plan-form-title">
        <div class="support-plan-panel__heading">
          <FileText :size="28" aria-hidden="true" />
          <div>
            <p class="eyebrow">Your selections</p>
            <h2 id="support-plan-form-title">Build the plan</h2>
          </div>
        </div>

        <EmailVerificationPanel :show-plan-link="false" />

        <form class="form-stack support-plan-form" novalidate @submit.prevent="submitPlan">
          <fieldset class="support-plan-fieldset">
            <legend>Support services</legend>
            <p id="support-services-hint" class="field-hint">
              Choose 1 to {{ maxSupportPlanResources }} services. {{ selectedCount }} selected.
            </p>
            <ul
              class="support-plan-options"
              aria-describedby="support-services-hint support-services-error"
            >
              <li v-for="resource in resources" :key="resource.id" class="support-plan-option">
                <label :for="`support-resource-${resource.id}`">
                  <input
                    :id="`support-resource-${resource.id}`"
                    v-model="form.resourceIds"
                    type="checkbox"
                    :value="resource.id"
                    :disabled="isResourceDisabled(resource.id)"
                  />
                  <span>
                    <strong>{{ resource.title }}</strong>
                    <small>{{ resource.category }} · {{ resource.deliveryModes.join(', ') }}</small>
                  </span>
                </label>
              </li>
            </ul>
            <p v-if="fieldErrors.resourceIds" id="support-services-error" class="field-error">
              {{ fieldErrors.resourceIds }}
            </p>
          </fieldset>

          <div class="form-field">
            <label for="support-contact-preference">Preferred way to make contact</label>
            <select
              id="support-contact-preference"
              v-model="form.contactPreference"
              :aria-describedby="
                fieldErrors.contactPreference ? 'support-contact-error' : undefined
              "
              :aria-invalid="Boolean(fieldErrors.contactPreference)"
              :disabled="isSubmitting"
            >
              <option v-for="preference in supportPlanContactPreferences" :key="preference">
                {{ preference }}
              </option>
            </select>
            <p
              v-if="fieldErrors.contactPreference"
              id="support-contact-error"
              class="field-error"
            >
              {{ fieldErrors.contactPreference }}
            </p>
          </div>

          <div class="form-field">
            <label for="support-plan-notes">Personal notes (optional)</label>
            <textarea
              id="support-plan-notes"
              v-model="form.notes"
              rows="5"
              :maxlength="maxSupportPlanNotesLength"
              :aria-describedby="
                fieldErrors.notes ? 'support-notes-hint support-notes-error' : 'support-notes-hint'
              "
              :aria-invalid="Boolean(fieldErrors.notes)"
              :disabled="isSubmitting"
            />
            <p id="support-notes-hint" class="field-hint support-plan-counter">
              {{ form.notes.length }} / {{ maxSupportPlanNotesLength }} characters
            </p>
            <p v-if="fieldErrors.notes" id="support-notes-error" class="field-error">
              {{ fieldErrors.notes }}
            </p>
          </div>

          <button
            class="button button--primary button--full"
            type="submit"
            :disabled="isSubmitting || !isEmailVerified"
          >
            <Send :size="19" aria-hidden="true" />
            {{ isSubmitting ? 'Sending support plan...' : 'Email plan with PDF' }}
          </button>
        </form>

        <p v-if="formError" class="form-notice form-notice--error" role="alert">
          {{ formError }}
        </p>
        <p v-if="successMessage" class="form-notice" role="status">
          {{ successMessage }}
        </p>
      </article>

      <aside class="account-note support-plan-note" aria-labelledby="support-plan-privacy-title">
        <LockKeyhole :size="26" aria-hidden="true" />
        <h2 id="support-plan-privacy-title">Sent only to your account</h2>
        <p>
          The server reads your verified address from Firebase Authentication. An address cannot be
          entered or changed in this form.
        </p>
        <p>
          Your selections and notes are used to create this email and PDF. They are not stored in
          your public profile.
        </p>
        <p>For immediate danger, call Triple Zero (000).</p>
      </aside>
    </div>
  </section>
</template>
