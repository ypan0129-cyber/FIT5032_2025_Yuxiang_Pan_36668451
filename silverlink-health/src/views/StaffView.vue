<script setup>
import { computed, onMounted, ref } from 'vue'
import { getRatingSummary } from '../services/ratingService'
import { resources } from '../data/resources'

const summaries = ref({})
const isRefreshing = ref(false)
const hasLoaded = ref(false)

const failedCount = computed(
  () => Object.values(summaries.value).filter((summary) => summary.status === 'failed').length,
)

const statusMessage = computed(() => {
  if (isRefreshing.value) {
    return 'Refreshing rating summaries...'
  }

  if (!hasLoaded.value) {
    return ''
  }

  if (failedCount.value) {
    return `${failedCount.value} rating ${failedCount.value === 1 ? 'summary is' : 'summaries are'} unavailable.`
  }

  return 'Rating summaries are up to date.'
})

function loadingSummary() {
  return {
    status: 'loading',
    averageScore: null,
    ratingCount: null,
  }
}

function unavailableSummary() {
  return {
    status: 'failed',
    averageScore: null,
    ratingCount: null,
  }
}

async function refreshSummaries() {
  isRefreshing.value = true
  summaries.value = Object.fromEntries(resources.map((resource) => [resource.id, loadingSummary()]))

  const nextSummaries = {}

  await Promise.all(
    resources.map(async (resource) => {
      try {
        const summary = await getRatingSummary(resource.id)
        nextSummaries[resource.id] = {
          status: 'ready',
          averageScore: summary?.averageScore ?? null,
          ratingCount: summary?.ratingCount ?? 0,
        }
      } catch {
        nextSummaries[resource.id] = unavailableSummary()
      }
    }),
  )

  summaries.value = nextSummaries
  hasLoaded.value = true
  isRefreshing.value = false
}

function getSummary(resourceId) {
  return summaries.value[resourceId] || loadingSummary()
}

function formatAverage(summary) {
  if (summary.status === 'loading') {
    return 'Loading...'
  }

  if (summary.status === 'failed') {
    return 'Unavailable'
  }

  return summary.averageScore === null ? 'No ratings yet' : `${summary.averageScore.toFixed(1)} / 5`
}

function formatRatingCount(summary) {
  if (summary.status === 'loading') {
    return 'Loading...'
  }

  if (summary.status === 'failed') {
    return 'Unavailable'
  }

  return `${summary.ratingCount} ${summary.ratingCount === 1 ? 'rating' : 'ratings'}`
}

onMounted(refreshSummaries)
</script>

<template>
  <section class="page-intro" aria-labelledby="staff-title">
    <div class="site-container page-intro__inner">
      <p class="eyebrow">Staff area</p>
      <h1 id="staff-title">Resource overview</h1>
      <p>Review the published support directory and member rating summaries.</p>
    </div>
  </section>

  <section class="section" aria-labelledby="staff-resources-title">
    <div class="site-container">
      <div class="results-heading">
        <div>
          <h2 id="staff-resources-title">Available resources</h2>
          <p>{{ resources.length }} total resources</p>
        </div>
        <button
          class="button button--secondary staff-refresh-button"
          type="button"
          :disabled="isRefreshing"
          @click="refreshSummaries"
        >
          {{ isRefreshing ? 'Refreshing...' : 'Refresh summaries' }}
        </button>
      </div>

      <p v-if="statusMessage" class="staff-status" role="status" aria-live="polite">
        {{ statusMessage }}
      </p>

      <ul class="resource-grid staff-resource-list" aria-label="Mental health resources">
        <li v-for="resource in resources" :key="resource.id" class="resource-card">
          <p class="resource-card__category">{{ resource.category }}</p>
          <h3 :id="`staff-resource-${resource.id}`">{{ resource.title }}</h3>

          <dl class="staff-resource__facts">
            <div>
              <dt>Average score</dt>
              <dd>{{ formatAverage(getSummary(resource.id)) }}</dd>
            </div>
            <div>
              <dt>Ratings</dt>
              <dd>{{ formatRatingCount(getSummary(resource.id)) }}</dd>
            </div>
          </dl>

          <RouterLink class="text-link resource-card__link" :to="`/resources/${resource.id}`">
            View resource
          </RouterLink>
        </li>
      </ul>
    </div>
  </section>
</template>

<style scoped>
.staff-resource-list {
  margin: 0;
  padding: 0;
  list-style: none;
}

.staff-resource__facts {
  margin: 4px 0 22px;
  padding-top: 18px;
  border-top: 1px solid var(--colour-border);
}

.staff-resource__facts > div {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 16px;
  padding: 8px 0;
  border-bottom: 1px solid var(--colour-border);
}

.staff-resource__facts dt,
.staff-resource__facts dd {
  margin: 0;
}

.staff-resource__facts dt {
  color: var(--colour-muted);
  font-weight: 700;
}

.staff-resource__facts dd {
  color: var(--colour-heading);
  font-weight: 700;
  text-align: right;
}

.staff-status {
  margin-top: -22px;
  color: var(--colour-muted);
}

@media (max-width: 575px) {
  .staff-refresh-button {
    width: 100%;
    margin-top: 12px;
  }

  .staff-status {
    margin-top: 0;
  }
}
</style>
