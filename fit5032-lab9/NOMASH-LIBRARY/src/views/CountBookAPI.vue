<script setup>
import { onMounted, ref } from 'vue'
import authorData from '@/assets/json/authors.json'

const loading = ref(false)
const error = ref(null)
const apiResponse = ref(null)

const getApiData = async () => {
  loading.value = true
  error.value = null

  try {
    const authors = authorData
    const authorsCount = authors.length
    const totalBooks = authors.reduce((total, author) => total + author.famousWorks.length, 0)

    apiResponse.value = {
      success: true,
      data: {
        authorsCount,
        totalBooks,
        authors: authors.map((author) => ({
          name: author.name,
          bookCount: author.famousWorks.length
        }))
      },
      timestamp: new Date().toISOString()
    }
  } catch (err) {
    error.value = `Error loading authors data: ${err.message}`
  } finally {
    loading.value = false
  }
}

onMounted(getApiData)
</script>

<template>
  <main class="api-page container">
    <section class="page-heading">
      <p class="eyebrow">Local JSON API</p>
      <h1>Count Book API</h1>
      <p>Summary statistics generated from <code>authors.json</code>.</p>
    </section>

    <p v-if="loading" class="status-message">Loading API data...</p>
    <p v-else-if="error" class="status-message error-message">{{ error }}</p>

    <template v-else-if="apiResponse">
      <section class="stats-grid" aria-label="Book statistics">
        <div class="stat-item">
          <span>Authors</span>
          <strong>{{ apiResponse.data.authorsCount }}</strong>
        </div>
        <div class="stat-item">
          <span>Books</span>
          <strong>{{ apiResponse.data.totalBooks }}</strong>
        </div>
      </section>

      <section class="json-panel">
        <h2>API response</h2>
        <pre>{{ JSON.stringify(apiResponse, null, 2) }}</pre>
      </section>
    </template>
  </main>
</template>

<style scoped>
.api-page {
  max-width: 960px;
  padding-top: 1.5rem;
  padding-bottom: 3rem;
}

.page-heading {
  padding: 2rem 0 1.5rem;
  border-bottom: 1px solid #dee2e6;
}

.eyebrow {
  margin-bottom: 0.35rem;
  color: #0d6efd;
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

h1,
h2 {
  color: #1d3557;
  font-weight: 700;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1rem;
  margin: 1.5rem 0;
}

.stat-item {
  padding: 1.25rem;
  border: 1px solid #dee2e6;
  border-radius: 6px;
  background: #f8fbff;
}

.stat-item span,
.stat-item strong {
  display: block;
}

.stat-item span {
  color: #5c677d;
}

.stat-item strong {
  margin-top: 0.25rem;
  color: #0d6efd;
  font-size: 2rem;
  font-weight: 700;
}

.json-panel {
  padding: 1.25rem;
  border: 1px solid #dee2e6;
  border-radius: 6px;
  background: #ffffff;
}

pre {
  max-height: 520px;
  margin: 1rem 0 0;
  padding: 1rem;
  overflow: auto;
  border-radius: 4px;
  background: #17202a;
  color: #e9f2ff;
  font-size: 0.88rem;
}

.status-message {
  margin: 1.5rem 0;
  padding: 0.85rem 1rem;
  border-left: 4px solid #0d6efd;
  background: #eef5ff;
}

.error-message {
  border-left-color: #dc3545;
  background: #fff1f2;
  color: #842029;
}

@media (max-width: 640px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }
}
</style>
