<script setup>
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useAuth } from '../auth'
import {
  getOwnRating,
  getRatingErrorMessage,
  getRatingSummary,
  saveOwnRating,
} from '../services/ratingService'

const props = defineProps({
  resourceId: {
    type: String,
    required: true,
  },
})

const route = useRoute()
const authState = useAuth()
const scoreOptions = [1, 2, 3, 4, 5]
const scoreLabels = {
  1: 'Not helpful',
  2: 'Slightly helpful',
  3: 'Moderately helpful',
  4: 'Very helpful',
  5: 'Extremely helpful',
}

const summary = ref({
  averageScore: null,
  ratingCount: 0,
})
const ownScore = ref(null)
const selectedScore = ref(null)
const isLoading = ref(true)
const isSaving = ref(false)
const successMessage = ref('')
const errorMessage = ref('')

// A monotonically increasing version prevents a slower request for an old
// resource or user from overwriting the currently displayed rating state.
let viewVersion = 0
let saveVersion = 0

const isMember = computed(() => authState.profile?.role === 'member')
const isReadOnlyRole = computed(() => ['staff', 'admin'].includes(authState.profile?.role))
const loginTarget = computed(() => ({
  name: 'login',
  query: { redirect: route.fullPath },
}))
const safeResourceId = computed(() =>
  props.resourceId.replace(/[^a-zA-Z0-9_-]/g, '-'),
)
const ratingGroupName = computed(() => `resource-rating-${safeResourceId.value}`)
const ratingHelpId = computed(() => `rating-help-${safeResourceId.value}`)

const averageLabel = computed(() => {
  if (isLoading.value) {
    return 'Loading rating'
  }

  if (summary.value.averageScore === null) {
    return 'No ratings yet'
  }

  return `${summary.value.averageScore.toFixed(1)} out of 5`
})

const ratingCountLabel = computed(() => {
  if (isLoading.value) {
    return 'Loading member ratings'
  }

  if (summary.value.ratingCount === 0) {
    return 'No member ratings yet'
  }

  return `${summary.value.ratingCount} member rating${summary.value.ratingCount === 1 ? '' : 's'}`
})

const submitLabel = computed(() => {
  if (isSaving.value) {
    return 'Saving...'
  }

  return ownScore.value === null ? 'Submit rating' : 'Update rating'
})

function getContext() {
  return {
    resourceId: props.resourceId,
    userId: authState.user?.uid || null,
    role: authState.profile?.role || null,
  }
}

function isCurrent(version, context) {
  const currentContext = getContext()

  return (
    version === viewVersion &&
    currentContext.resourceId === context.resourceId &&
    currentContext.userId === context.userId &&
    currentContext.role === context.role
  )
}

function normaliseSummary(result) {
  const averageScore = result?.averageScore
  const ratingCount = result?.ratingCount

  summary.value = {
    averageScore:
      typeof averageScore === 'number' && Number.isFinite(averageScore)
        ? averageScore
        : null,
    ratingCount:
      Number.isInteger(ratingCount) && ratingCount >= 0 ? ratingCount : 0,
  }
}

function normaliseOwnScore(score) {
  return Number.isInteger(score) && score >= 1 && score <= 5 ? score : null
}

function getErrorMessage(error, fallback) {
  return getRatingErrorMessage(error) || fallback
}

async function loadRatings() {
  const version = ++viewVersion
  const context = getContext()

  saveVersion += 1
  isSaving.value = false
  isLoading.value = true
  // A route or account change invalidates any previous save operation. Reset
  // the visual saving state so the new context cannot inherit a disabled form.
  isSaving.value = false
  successMessage.value = ''
  errorMessage.value = ''
  summary.value = { averageScore: null, ratingCount: 0 }
  ownScore.value = null
  selectedScore.value = null

  try {
    const ratingSummary = await getRatingSummary(context.resourceId)

    if (!isCurrent(version, context)) {
      return
    }

    normaliseSummary(ratingSummary)

    if (context.role === 'member' && context.userId) {
      const savedScore = await getOwnRating(context.resourceId)

      if (!isCurrent(version, context)) {
        return
      }

      ownScore.value = normaliseOwnScore(savedScore)
      selectedScore.value = ownScore.value
    }
  } catch (error) {
    if (isCurrent(version, context)) {
      errorMessage.value = getErrorMessage(
        error,
        'We could not load the rating information. Please try again.',
      )
    }
  } finally {
    if (isCurrent(version, context)) {
      isLoading.value = false
    }
  }
}

async function submitRating() {
  if (!isMember.value || selectedScore.value === null || isSaving.value) {
    return
  }

  const score = selectedScore.value
  const context = getContext()
  const version = ++viewVersion
  const currentSaveVersion = ++saveVersion
  const hadExistingRating = ownScore.value !== null

  isSaving.value = true
  successMessage.value = ''
  errorMessage.value = ''

  try {
    await saveOwnRating(context.resourceId, score)

    if (
      currentSaveVersion !== saveVersion ||
      !isCurrent(version, context)
    ) {
      return
    }

    ownScore.value = score
    successMessage.value = hadExistingRating
      ? 'Your rating has been updated.'
      : 'Thank you. Your rating has been submitted.'

    try {
      const refreshedSummary = await getRatingSummary(context.resourceId)

      if (currentSaveVersion === saveVersion && isCurrent(version, context)) {
        normaliseSummary(refreshedSummary)
      }
    } catch (error) {
      if (currentSaveVersion === saveVersion && isCurrent(version, context)) {
        errorMessage.value = `Your rating was saved, but the summary could not be refreshed. ${getErrorMessage(
          error,
          'Please refresh the page to see the latest average.',
        )}`
      }
    }
  } catch (error) {
    if (currentSaveVersion === saveVersion && isCurrent(version, context)) {
      errorMessage.value = getErrorMessage(
        error,
        'We could not save your rating. Please try again.',
      )
    }
  } finally {
    if (currentSaveVersion === saveVersion && isCurrent(version, context)) {
      isSaving.value = false
    }
  }
}

watch(
  [
    () => props.resourceId,
    () => authState.user?.uid || null,
    () => authState.profile?.role || null,
  ],
  loadRatings,
  { immediate: true },
)

onBeforeUnmount(() => {
  viewVersion += 1
  saveVersion += 1
})
</script>

<template>
  <div class="resource-rating">
    <div class="rating-summary" aria-live="polite">
      <p class="rating-summary__score">{{ averageLabel }}</p>
      <p class="rating-summary__count">{{ ratingCountLabel }}</p>
    </div>

    <p v-if="isLoading" class="form-notice" role="status">
      Loading rating information...
    </p>

    <p v-if="errorMessage" class="form-notice form-notice--error" role="alert">
      {{ errorMessage }}
    </p>

    <p v-if="successMessage" class="form-notice" role="status">
      {{ successMessage }}
    </p>

    <template v-if="!isLoading">
      <form v-if="isMember" class="rating-form" @submit.prevent="submitRating">
        <fieldset :disabled="isSaving">
          <legend>Your helpfulness rating</legend>
          <p :id="ratingHelpId" class="field-hint">
            Choose one score from 1 (not helpful) to 5 (extremely helpful).
          </p>
          <div class="rating-options">
            <div v-for="score in scoreOptions" :key="score" class="rating-choice">
              <input
                :id="`${ratingGroupName}-${score}`"
                v-model="selectedScore"
                :name="ratingGroupName"
                type="radio"
                :value="score"
                :aria-describedby="ratingHelpId"
              />
              <label :for="`${ratingGroupName}-${score}`">
                <span class="rating-choice__number">{{ score }}</span>
                <span class="rating-choice__label">{{ scoreLabels[score] }}</span>
              </label>
            </div>
          </div>
        </fieldset>
        <button
          class="button button--primary"
          type="submit"
          :disabled="selectedScore === null || isSaving"
        >
          {{ submitLabel }}
        </button>
      </form>

      <p v-else-if="isReadOnlyRole" class="form-notice">
        Staff and administrator accounts can view the member rating summary but cannot submit a
        member rating.
      </p>

      <p v-else-if="authState.user" class="form-notice form-notice--error">
        Rating controls are unavailable until your member profile is ready.
      </p>

      <div v-else class="rating-login">
        <p>Members can share how helpful this service was.</p>
        <RouterLink class="button button--secondary" :to="loginTarget">
          Log in to rate
        </RouterLink>
      </div>
    </template>
  </div>
</template>

<style scoped>
.resource-rating {
  margin-top: 20px;
}

.rating-summary {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 5px 18px;
  margin-bottom: 20px;
}

.rating-summary p {
  margin-bottom: 0;
}

.rating-summary__score {
  color: var(--colour-heading);
  font-size: 1.2rem;
  font-weight: 700;
}

.rating-summary__count {
  color: var(--colour-muted);
}

.rating-form {
  margin-top: 22px;
}

.rating-form fieldset {
  min-width: 0;
  margin: 0 0 18px;
  padding: 0;
  border: 0;
}

.rating-form legend {
  margin-bottom: 4px;
  color: var(--colour-heading);
  font-weight: 700;
}

.rating-form .field-hint {
  margin-bottom: 14px;
}

.rating-options {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 8px;
}

.rating-choice {
  position: relative;
  min-width: 0;
}

.rating-choice input {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  margin: 0;
  cursor: pointer;
  opacity: 0;
}

.rating-choice label {
  display: flex;
  min-height: 62px;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 6px 4px;
  border: 1px solid var(--colour-border);
  border-radius: 4px;
  background: #ffffff;
  color: var(--colour-heading);
  text-align: center;
  cursor: pointer;
}

.rating-choice label:hover {
  border-color: var(--colour-primary);
}

.rating-choice input:checked + label {
  border-color: var(--colour-primary);
  background: var(--colour-primary-light);
  color: var(--colour-primary-dark);
}

.rating-choice input:focus-visible + label {
  outline: 3px solid var(--colour-focus);
  outline-offset: 3px;
}

.rating-choice__number {
  font-size: 1.12rem;
  font-weight: 700;
  line-height: 1.1;
}

.rating-choice__label {
  margin-top: 3px;
  font-size: 0.78rem;
  line-height: 1.2;
}

.rating-login p {
  margin-bottom: 14px;
}

@media (max-width: 520px) {
  .rating-options {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .rating-choice:last-child {
    grid-column: 1 / -1;
  }
}
</style>
