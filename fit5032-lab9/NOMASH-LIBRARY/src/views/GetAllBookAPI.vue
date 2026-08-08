<script setup>
import { onMounted, ref } from 'vue'
import axios from 'axios'
import { cloudFunctionUrls } from '@/services/cloudFunctions.js'

const marketplaceData = ref(null)
const loading = ref(false)
const error = ref('')

const loadMarketplaceData = async () => {
  loading.value = true
  error.value = ''

  try {
    const response = await axios.get(cloudFunctionUrls.sellBookData)
    marketplaceData.value = response.data
  } catch (requestError) {
    marketplaceData.value = null
    error.value = requestError.response?.data?.error || requestError.message
  } finally {
    loading.value = false
  }
}

const formatPrice = (value, currency) =>
  new Intl.NumberFormat('en-AU', { style: 'currency', currency }).format(value)

onMounted(loadMarketplaceData)
</script>

<template>
  <main class="marketplace-page container">
    <section class="page-heading">
      <p class="eyebrow">Alibaba Cloud Data Product</p>
      <h1>Book Data Marketplace</h1>
      <p>A priced JSON dataset delivered by the <code>sellBookData</code> cloud function.</p>
    </section>

    <div class="toolbar">
      <button
        class="btn btn-outline-primary"
        type="button"
        :disabled="loading"
        @click="loadMarketplaceData"
      >
        {{ loading ? 'Loading data...' : 'Refresh cloud data' }}
      </button>
      <code>{{ cloudFunctionUrls.sellBookData }}</code>
    </div>

    <p v-if="error" class="error-message" role="alert">{{ error }}</p>

    <template v-if="marketplaceData">
      <section class="quote-band" aria-label="Dataset quote">
        <div>
          <span>Dataset</span>
          <strong>{{ marketplaceData.product.name }}</strong>
        </div>
        <div>
          <span>Records</span>
          <strong>{{ marketplaceData.product.recordCount }}</strong>
        </div>
        <div>
          <span>Price per record</span>
          <strong>{{
            formatPrice(marketplaceData.product.unitPrice, marketplaceData.product.currency)
          }}</strong>
        </div>
        <div class="total-price">
          <span>Package quote</span>
          <strong>{{
            formatPrice(marketplaceData.product.totalPrice, marketplaceData.product.currency)
          }}</strong>
        </div>
      </section>

      <section class="catalogue-section">
        <div class="section-heading">
          <div>
            <h2>Delivered catalogue</h2>
            <p>Generated {{ new Date(marketplaceData.generatedAt).toLocaleString() }}</p>
          </div>
          <span class="live-badge">
            {{
              marketplaceData.source === 'firestore' ? 'Live Firestore data' : 'Bundled JSON data'
            }}
          </span>
        </div>

        <div class="table-responsive">
          <table class="table align-middle">
            <thead>
              <tr>
                <th scope="col">Book name</th>
                <th scope="col">ISBN</th>
                <th scope="col">Record ID</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="book in marketplaceData.books" :key="book.id">
                <td class="book-name">{{ book.name }}</td>
                <td>{{ book.isbn ?? 'Not supplied' }}</td>
                <td>
                  <code>{{ book.id }}</code>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <details class="json-panel">
        <summary>View raw JSON response</summary>
        <pre>{{ JSON.stringify(marketplaceData, null, 2) }}</pre>
      </details>
    </template>
  </main>
</template>

<style scoped>
.marketplace-page {
  max-width: 1100px;
  padding-top: 1.5rem;
  padding-bottom: 3rem;
}

.page-heading {
  padding: 2rem 0 1.5rem;
  border-bottom: 1px solid #dee2e6;
}

.eyebrow {
  margin-bottom: 0.35rem;
  color: #a33a2b;
  font-size: 0.78rem;
  font-weight: 700;
  text-transform: uppercase;
}

h1,
h2 {
  color: #213547;
  font-weight: 700;
}

.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 1rem 0;
}

.toolbar code {
  overflow-wrap: anywhere;
  color: #4b5a67;
  text-align: right;
}

.quote-band {
  display: grid;
  grid-template-columns: 1.6fr repeat(3, 1fr);
  border-block: 1px solid #d9dee7;
  background: #f7f9fb;
}

.quote-band > div {
  display: grid;
  gap: 0.3rem;
  padding: 1rem;
  border-right: 1px solid #d9dee7;
}

.quote-band > div:last-child {
  border-right: 0;
}

.quote-band span {
  color: #65717c;
  font-size: 0.78rem;
  font-weight: 700;
  text-transform: uppercase;
}

.quote-band strong {
  color: #253746;
}

.quote-band .total-price {
  background: #eaf6ef;
}

.quote-band .total-price strong {
  color: #146c43;
  font-size: 1.35rem;
}

.catalogue-section {
  padding: 1.5rem 0;
}

.section-heading {
  display: flex;
  align-items: start;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1rem;
}

.section-heading h2,
.section-heading p {
  margin-bottom: 0.2rem;
}

.section-heading p {
  color: #65717c;
}

.live-badge {
  padding: 0.35rem 0.6rem;
  border: 1px solid #198754;
  color: #146c43;
  font-size: 0.78rem;
  font-weight: 700;
  white-space: nowrap;
}

.book-name {
  font-weight: 650;
}

.json-panel {
  border-top: 1px solid #d9dee7;
  padding-top: 1rem;
}

.json-panel summary {
  cursor: pointer;
  color: #334e68;
  font-weight: 650;
}

pre {
  max-height: 500px;
  margin: 1rem 0 0;
  padding: 1rem;
  overflow: auto;
  background: #17202a;
  color: #e9f2ff;
  font-size: 0.88rem;
}

.error-message {
  margin-top: 1rem;
  padding: 1rem;
  border-left: 5px solid #dc3545;
  background: #fff1f2;
  color: #842029;
}

@media (max-width: 820px) {
  .quote-band {
    grid-template-columns: repeat(2, 1fr);
  }

  .quote-band > div:nth-child(2) {
    border-right: 0;
  }
}

@media (max-width: 640px) {
  .toolbar,
  .section-heading {
    align-items: stretch;
    flex-direction: column;
  }

  .toolbar code {
    text-align: left;
  }

  .quote-band {
    grid-template-columns: 1fr;
  }

  .quote-band > div {
    border-right: 0;
    border-bottom: 1px solid #d9dee7;
  }

  .quote-band > div:last-child {
    border-bottom: 0;
  }
}
</style>
