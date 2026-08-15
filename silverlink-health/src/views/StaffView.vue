<script setup>
import { DatabaseBackup, RefreshCw } from '@lucide/vue'
import { computed, defineAsyncComponent, onMounted, ref } from 'vue'
import DataTable from '../components/DataTable.vue'
import { getRatingErrorMessage, getRatingSummary, rebuildRatingAnalytics } from '../services/ratingService'
import { resources } from '../data/resources'

const RatingAnalyticsChart = defineAsyncComponent(
  () => import('../components/RatingAnalyticsChart.vue'),
)

const summaries = ref({})
const isRefreshing = ref(false)
const isRebuilding = ref(false)
const hasLoaded = ref(false)
const rebuildMessage = ref('')
const rebuildError = ref('')

const summaryColumns = [
  { key: 'title', label: 'Service', searchable: true },
  { key: 'category', label: 'Concern', searchable: true },
  {
    key: 'averageScore',
    label: 'Average score',
    align: 'right',
    exportValue: (row) => formatAverage(row),
  },
  {
    key: 'ratingCount',
    label: 'Ratings',
    align: 'right',
    exportValue: (row) => formatRatingCount(row),
  },
]

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

const summaryRows = computed(() =>
  resources.map((resource) => ({
    ...resource,
    ...getSummary(resource.id),
  })),
)

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

async function rebuildSummaries() {
  if (isRefreshing.value || isRebuilding.value) {
    return
  }

  isRebuilding.value = true
  rebuildMessage.value = ''
  rebuildError.value = ''

  try {
    const result = await rebuildRatingAnalytics()
    rebuildMessage.value = `Rating analytics rebuilt for ${result.rebuilt} resources.`
    await refreshSummaries()
  } catch (error) {
    rebuildError.value = getRatingErrorMessage(error)
  } finally {
    isRebuilding.value = false
  }
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
        <div class="staff-actions">
          <button
            class="button button--secondary"
            type="button"
            :disabled="isRefreshing || isRebuilding"
            @click="rebuildSummaries"
          >
            <DatabaseBackup :size="18" aria-hidden="true" />
            {{ isRebuilding ? 'Rebuilding...' : 'Rebuild analytics' }}
          </button>
          <button
            class="button button--secondary"
            type="button"
            :disabled="isRefreshing || isRebuilding"
            @click="refreshSummaries"
          >
            <RefreshCw :size="18" :class="{ 'staff-refresh-icon--active': isRefreshing }" aria-hidden="true" />
            {{ isRefreshing ? 'Refreshing...' : 'Refresh summaries' }}
          </button>
        </div>
      </div>

      <p v-if="statusMessage" class="staff-status" role="status" aria-live="polite">
        {{ statusMessage }}
      </p>
      <p v-if="rebuildMessage" class="staff-operation-message" role="status">
        {{ rebuildMessage }}
      </p>
      <p v-if="rebuildError" class="staff-operation-message staff-operation-message--error" role="alert">
        {{ rebuildError }}
      </p>

      <RatingAnalyticsChart :rows="summaryRows" :is-loading="!hasLoaded || isRefreshing" />

      <DataTable
        :rows="summaryRows"
        :columns="summaryColumns"
        caption="Member rating summaries for mental health resources"
        initial-sort-key="title"
        empty-message="No rating summaries match this table search."
        export-file-name="silverlink-rating-summaries"
        export-title="SilverLink Health Rating Summaries"
      >
        <template #cell-title="{ row }">
          <RouterLink class="text-link" :to="`/resources/${row.id}`">
            {{ row.title }}
          </RouterLink>
        </template>
        <template #cell-averageScore="{ row }">
          {{ formatAverage(row) }}
        </template>
        <template #cell-ratingCount="{ row }">
          {{ formatRatingCount(row) }}
        </template>
      </DataTable>
    </div>
  </section>
</template>

<style scoped>
.staff-status {
  margin-top: -22px;
  color: var(--colour-muted);
}

.staff-actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 10px;
}

.staff-operation-message {
  margin: -10px 0 24px;
  color: var(--colour-primary-dark);
}

.staff-operation-message--error {
  color: #8f2f2f;
}

.staff-refresh-icon--active {
  animation: staff-refresh-spin 0.8s linear infinite;
}

@keyframes staff-refresh-spin {
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 575px) {
  .staff-actions,
  .staff-actions .button {
    width: 100%;
  }

  .staff-status {
    margin-top: 0;
  }
}

@media (prefers-reduced-motion: reduce) {
  .staff-refresh-icon--active {
    animation: none;
  }
}
</style>
