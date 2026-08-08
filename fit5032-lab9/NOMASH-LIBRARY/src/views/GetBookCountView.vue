<script setup>
import { ref } from 'vue'
import axios from 'axios'
import { cloudFunctionUrls } from '@/services/cloudFunctions.js'

const count = ref(null)
const generatedAt = ref('')
const loading = ref(false)
const error = ref('')

const getBookCount = async () => {
  loading.value = true
  error.value = ''

  try {
    const response = await axios.get(cloudFunctionUrls.countBooks)
    count.value = response.data.count
    generatedAt.value = response.data.generatedAt
  } catch (requestError) {
    count.value = null
    error.value = requestError.response?.data?.error || requestError.message
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <main class="counter-page container">
    <section class="page-heading">
      <p class="eyebrow">Alibaba Cloud Function</p>
      <h1>Book Counter</h1>
      <p>Count the records returned by the cloud-hosted <code>books</code> dataset.</p>
    </section>

    <section class="counter-tool" aria-live="polite">
      <button class="btn btn-primary" type="button" :disabled="loading" @click="getBookCount">
        <span
          v-if="loading"
          class="spinner-border spinner-border-sm me-2"
          aria-hidden="true"
        ></span>
        {{ loading ? 'Counting books...' : 'Get Book Count' }}
      </button>

      <div v-if="count !== null" class="result-panel">
        <span>Total number of books</span>
        <strong>{{ count }}</strong>
        <small v-if="generatedAt"
          >Cloud response: {{ new Date(generatedAt).toLocaleString() }}</small
        >
      </div>

      <p v-if="error" class="error-message" role="alert">
        <strong>Unable to get the book count.</strong>
        <span>{{ error }}</span>
      </p>
    </section>

    <section class="endpoint-panel">
      <h2>Function endpoint</h2>
      <code>{{ cloudFunctionUrls.countBooks }}</code>
    </section>
  </main>
</template>

<style scoped>
.counter-page {
  max-width: 900px;
  padding-top: 1.5rem;
  padding-bottom: 3rem;
}

.page-heading {
  padding: 1.5rem 0;
  border-bottom: 1px solid #d9dee7;
}

.eyebrow {
  margin-bottom: 0.35rem;
  color: #0b6bcb;
  font-size: 0.78rem;
  font-weight: 700;
  text-transform: uppercase;
}

h1,
h2 {
  color: #213547;
  font-weight: 700;
}

.counter-tool {
  padding: 1.5rem 0;
}

.result-panel {
  display: grid;
  grid-template-columns: 1fr auto;
  align-items: center;
  gap: 0.35rem 1rem;
  margin-top: 1.25rem;
  padding: 1.25rem;
  border-left: 5px solid #198754;
  background: #f0f8f4;
}

.result-panel span {
  color: #3d4d45;
  font-weight: 600;
}

.result-panel strong {
  grid-row: span 2;
  color: #146c43;
  font-size: 2.4rem;
  line-height: 1;
}

.result-panel small {
  color: #66756d;
}

.error-message {
  display: grid;
  gap: 0.25rem;
  margin-top: 1.25rem;
  padding: 1rem;
  border-left: 5px solid #dc3545;
  background: #fff1f2;
  color: #842029;
}

.endpoint-panel {
  padding-top: 1.25rem;
  border-top: 1px solid #d9dee7;
}

.endpoint-panel h2 {
  font-size: 1rem;
}

.endpoint-panel code {
  display: block;
  padding: 0.85rem;
  overflow-wrap: anywhere;
  background: #f4f6f8;
  color: #2b4055;
}

@media (max-width: 640px) {
  .result-panel {
    grid-template-columns: 1fr;
  }

  .result-panel strong {
    grid-row: auto;
  }
}
</style>
