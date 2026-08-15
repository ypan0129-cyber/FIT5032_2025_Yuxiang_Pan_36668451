<script setup>
import { Activity, Mail, RefreshCw, ShieldCheck, Star, Users } from '@lucide/vue'
import { computed, onMounted, ref } from 'vue'
import { getAdminErrorMessage, getAdminMetrics } from '../services/adminService'

const metrics = ref(null)
const isLoading = ref(false)
const errorMessage = ref('')

const roleRows = computed(() => {
  const roles = metrics.value?.users.roles

  return roles
    ? [
        { label: 'Members', value: roles.member },
        { label: 'Staff', value: roles.staff },
        { label: 'Administrators', value: roles.admin },
        { label: 'Other or incomplete', value: roles.other },
      ]
    : []
})

const emailStatusRows = computed(() => {
  const statuses = metrics.value?.emails.latestStatuses

  return statuses
    ? [
        { label: 'Last sent', value: statuses.sent },
        { label: 'Last failed', value: statuses.failed },
        { label: 'Pending', value: statuses.pending },
        { label: 'Other or not recorded', value: statuses.other },
      ]
    : []
})

const generatedAtLabel = computed(() => {
  if (!metrics.value?.generatedAt) return ''

  return new Intl.DateTimeFormat('en-AU', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(metrics.value.generatedAt))
})

function formatNumber(value) {
  return new Intl.NumberFormat('en-AU').format(value)
}

function formatAverage(value) {
  return value === null ? 'No ratings' : `${value.toFixed(1)} / 5`
}

async function refreshMetrics() {
  if (isLoading.value) return

  isLoading.value = true
  errorMessage.value = ''

  try {
    metrics.value = await getAdminMetrics()
  } catch (error) {
    errorMessage.value = getAdminErrorMessage(error)
  } finally {
    isLoading.value = false
  }
}

onMounted(refreshMetrics)
</script>

<template>
  <section class="page-intro" aria-labelledby="admin-title">
    <div class="site-container page-intro__inner">
      <p class="eyebrow">Administrator area</p>
      <h1 id="admin-title">System overview</h1>
      <p>Monitor account roles and privacy-safe service activity across SilverLink Health.</p>
    </div>
  </section>

  <section class="section admin-dashboard" aria-labelledby="admin-metrics-title">
    <div class="site-container">
      <div class="results-heading admin-dashboard__heading">
        <div>
          <h2 id="admin-metrics-title">Current metrics</h2>
          <p v-if="generatedAtLabel">Updated {{ generatedAtLabel }}</p>
          <p v-else>{{ isLoading ? 'Loading system metrics...' : 'No metrics loaded' }}</p>
        </div>
        <button
          class="button button--secondary"
          type="button"
          :disabled="isLoading"
          @click="refreshMetrics"
        >
          <RefreshCw
            :size="18"
            :class="{ 'admin-refresh-icon--active': isLoading }"
            aria-hidden="true"
          />
          {{ isLoading ? 'Refreshing...' : 'Refresh metrics' }}
        </button>
      </div>

      <p v-if="errorMessage" class="form-notice form-notice--error" role="alert">
        {{ errorMessage }}
      </p>

      <div v-if="metrics" class="admin-metric-grid">
        <article class="admin-metric">
          <Users :size="24" aria-hidden="true" />
          <p>Account profiles</p>
          <strong>{{ formatNumber(metrics.users.total) }}</strong>
          <span>All role categories</span>
        </article>
        <article class="admin-metric">
          <ShieldCheck :size="24" aria-hidden="true" />
          <p>Members</p>
          <strong>{{ formatNumber(metrics.users.roles.member) }}</strong>
          <span>Active member profiles</span>
        </article>
        <article class="admin-metric">
          <Star :size="24" aria-hidden="true" />
          <p>Member ratings</p>
          <strong>{{ formatNumber(metrics.ratings.totalRatings) }}</strong>
          <span>Across known resources</span>
        </article>
        <article class="admin-metric">
          <Mail :size="24" aria-hidden="true" />
          <p>Email attempts today</p>
          <strong>{{ formatNumber(metrics.emails.attemptsToday) }}</strong>
          <span>Current UTC day</span>
        </article>
      </div>

      <div v-else-if="isLoading" class="admin-loading" role="status">
        <Activity :size="30" aria-hidden="true" />
        <p>Loading system metrics...</p>
      </div>

      <div v-else-if="errorMessage" class="admin-loading">
        <Activity :size="30" aria-hidden="true" />
        <p>Metrics will appear here after a successful refresh.</p>
      </div>
    </div>
  </section>

  <section v-if="metrics" class="section section--muted" aria-labelledby="admin-breakdown-title">
    <div class="site-container">
      <div class="section-heading">
        <p class="eyebrow">Breakdown</p>
        <h2 id="admin-breakdown-title">Roles and service activity</h2>
      </div>

      <div class="admin-breakdown">
        <section aria-labelledby="admin-roles-title">
          <h3 id="admin-roles-title">Role distribution</h3>
          <dl class="admin-stat-list">
            <div v-for="row in roleRows" :key="row.label">
              <dt>{{ row.label }}</dt>
              <dd>{{ formatNumber(row.value) }}</dd>
            </div>
          </dl>
        </section>

        <section aria-labelledby="admin-ratings-title">
          <h3 id="admin-ratings-title">Rating activity</h3>
          <dl class="admin-stat-list">
            <div>
              <dt>Average score</dt>
              <dd>{{ formatAverage(metrics.ratings.averageScore) }}</dd>
            </div>
            <div>
              <dt>Resources with ratings</dt>
              <dd>
                {{ formatNumber(metrics.ratings.ratedResources) }} of
                {{ formatNumber(metrics.ratings.resourceCount) }}
              </dd>
            </div>
            <div>
              <dt>Total member ratings</dt>
              <dd>{{ formatNumber(metrics.ratings.totalRatings) }}</dd>
            </div>
          </dl>
        </section>

        <section aria-labelledby="admin-email-title">
          <h3 id="admin-email-title">Latest email outcomes</h3>
          <dl class="admin-stat-list">
            <div v-for="row in emailStatusRows" :key="row.label">
              <dt>{{ row.label }}</dt>
              <dd>{{ formatNumber(row.value) }}</dd>
            </div>
            <div>
              <dt>Tracked accounts</dt>
              <dd>{{ formatNumber(metrics.emails.trackedAccounts) }}</dd>
            </div>
          </dl>
        </section>
      </div>
    </div>
  </section>
</template>

<style scoped>
.admin-dashboard__heading {
  align-items: flex-end;
}

.admin-dashboard > .site-container > .form-notice {
  margin-bottom: 24px;
}

.admin-metric-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 18px;
}

.admin-metric {
  min-width: 0;
  min-height: 164px;
  padding: 22px;
  border: 1px solid var(--colour-border);
  border-radius: var(--radius);
  background: #ffffff;
}

.admin-metric svg {
  margin-bottom: 18px;
  color: var(--colour-primary);
}

.admin-metric p,
.admin-metric span {
  margin: 0;
  color: var(--colour-muted);
}

.admin-metric strong {
  display: block;
  margin: 4px 0;
  color: var(--colour-heading);
  font-size: 1.8rem;
  line-height: 1.2;
}

.admin-metric span {
  display: block;
  font-size: 0.82rem;
}

.admin-loading {
  min-height: 164px;
  display: grid;
  place-items: center;
  align-content: center;
  gap: 12px;
  border-block: 1px solid var(--colour-border);
  color: var(--colour-muted);
  text-align: center;
}

.admin-loading p {
  margin: 0;
}

.admin-breakdown {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  border-block: 1px solid var(--colour-border);
}

.admin-breakdown > section {
  min-width: 0;
  padding: 26px 28px 24px 0;
}

.admin-breakdown > section + section {
  padding-left: 28px;
  border-left: 1px solid var(--colour-border);
}

.admin-stat-list {
  margin: 0;
}

.admin-stat-list > div {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  padding-block: 10px;
  border-top: 1px solid var(--colour-border);
}

.admin-stat-list dt {
  color: var(--colour-muted);
}

.admin-stat-list dd {
  margin: 0;
  color: var(--colour-heading);
  font-weight: 700;
  text-align: right;
}

.admin-refresh-icon--active {
  animation: admin-refresh-spin 0.8s linear infinite;
}

@keyframes admin-refresh-spin {
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 991px) {
  .admin-metric-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .admin-breakdown {
    grid-template-columns: 1fr;
  }

  .admin-breakdown > section,
  .admin-breakdown > section + section {
    padding: 24px 0;
    border-left: 0;
  }

  .admin-breakdown > section + section {
    border-top: 1px solid var(--colour-border);
  }
}

@media (max-width: 575px) {
  .admin-dashboard__heading,
  .admin-dashboard__heading .button {
    width: 100%;
  }

  .admin-metric-grid {
    grid-template-columns: 1fr;
  }
}

@media (prefers-reduced-motion: reduce) {
  .admin-refresh-icon--active {
    animation: none;
  }
}
</style>
