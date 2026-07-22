<script setup>
import { Search, X } from '@lucide/vue'
import { computed, ref } from 'vue'
import ResourceCard from '../components/ResourceCard.vue'
import { deliveryModes, resources, supportCategories } from '../data/resources'

const searchTerm = ref('')
const selectedCategory = ref('')
const selectedMode = ref('')

const filteredResources = computed(() => {
  const query = searchTerm.value.trim().toLowerCase()

  return resources.filter((resource) => {
    const matchesSearch =
      !query ||
      resource.title.toLowerCase().includes(query) ||
      resource.summary.toLowerCase().includes(query) ||
      resource.category.toLowerCase().includes(query)
    const matchesCategory =
      !selectedCategory.value || resource.category === selectedCategory.value
    const matchesMode =
      !selectedMode.value || resource.deliveryModes.includes(selectedMode.value)

    return matchesSearch && matchesCategory && matchesMode
  })
})

const hasFilters = computed(
  () => Boolean(searchTerm.value || selectedCategory.value || selectedMode.value),
)

function clearFilters() {
  searchTerm.value = ''
  selectedCategory.value = ''
  selectedMode.value = ''
}
</script>

<template>
  <section class="page-intro">
    <div class="site-container page-intro__inner">
      <p class="eyebrow">Resource directory</p>
      <h1>Find mental health support</h1>
      <p>Search trusted Australian services by concern or preferred support method.</p>
    </div>
  </section>

  <section class="section" aria-labelledby="resource-results-title">
    <div class="site-container">
      <form class="filter-panel" role="search" @submit.prevent>
        <div class="form-field form-field--search">
          <label for="resource-search">Search resources</label>
          <div class="input-with-icon">
            <Search :size="20" aria-hidden="true" />
            <input
              id="resource-search"
              v-model="searchTerm"
              type="search"
              placeholder="Name or concern"
            />
          </div>
        </div>

        <div class="form-field">
          <label for="category-filter">Concern</label>
          <select id="category-filter" v-model="selectedCategory">
            <option value="">All concerns</option>
            <option v-for="category in supportCategories" :key="category" :value="category">
              {{ category }}
            </option>
          </select>
        </div>

        <div class="form-field">
          <label for="mode-filter">Support method</label>
          <select id="mode-filter" v-model="selectedMode">
            <option value="">All methods</option>
            <option v-for="mode in deliveryModes" :key="mode" :value="mode">
              {{ mode }}
            </option>
          </select>
        </div>

        <button
          v-if="hasFilters"
          class="button button--quiet filter-panel__clear"
          type="button"
          @click="clearFilters"
        >
          <X :size="18" aria-hidden="true" />
          Clear
        </button>
      </form>

      <div class="results-heading">
        <h2 id="resource-results-title">Available resources</h2>
        <p aria-live="polite">
          {{ filteredResources.length }} {{ filteredResources.length === 1 ? 'result' : 'results' }}
        </p>
      </div>

      <div v-if="filteredResources.length" class="resource-grid">
        <ResourceCard
          v-for="resource in filteredResources"
          :key="resource.id"
          :resource="resource"
        />
      </div>

      <div v-else class="empty-state">
        <Search :size="30" aria-hidden="true" />
        <h3>No matching resources</h3>
        <p>Try a different search term or clear the filters.</p>
        <button class="button button--secondary" type="button" @click="clearFilters">
          Clear filters
        </button>
      </div>
    </div>
  </section>
</template>
