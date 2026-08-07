<script setup>
import { computed } from 'vue'
import authorData from '@/assets/json/authors.json'

const books = computed(() => {
  return authorData.flatMap((author) => {
    return author.famousWorks.map((book) => ({
      author: author.name,
      title: book.title,
      year: book.year
    }))
  })
})

const apiResponse = computed(() => ({
  success: true,
  data: {
    totalBooks: books.value.length,
    books: books.value
  },
  timestamp: new Date().toISOString()
}))
</script>

<template>
  <main class="api-page container">
    <section class="page-heading">
      <p class="eyebrow">Local JSON API</p>
      <h1>Get All Book API</h1>
      <p>All books from every author in <code>authors.json</code>, returned as JSON.</p>
    </section>

    <section class="json-panel">
      <div class="panel-heading">
        <h2>API response</h2>
        <span>{{ books.length }} books</span>
      </div>
      <pre>{{ JSON.stringify(apiResponse, null, 2) }}</pre>
    </section>
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

.json-panel {
  margin-top: 1.5rem;
  padding: 1.25rem;
  border: 1px solid #dee2e6;
  border-radius: 6px;
  background: #ffffff;
}

.panel-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.panel-heading span {
  color: #5c677d;
  white-space: nowrap;
}

pre {
  margin: 1rem 0 0;
  padding: 1rem;
  border-radius: 4px;
  background: #17202a;
  color: #e9f2ff;
  font-size: 0.88rem;
}
</style>
