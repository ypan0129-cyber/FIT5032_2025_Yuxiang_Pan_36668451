<script setup>
import { Bookmark } from '@lucide/vue'
import ResourceCard from '../components/ResourceCard.vue'
import { useSavedResources } from '../services/savedResources'

const { savedResources } = useSavedResources()
</script>

<template>
  <section class="page-intro">
    <div class="site-container page-intro__inner">
      <p class="eyebrow">Saved directory</p>
      <h1>Saved resources</h1>
      <p>Public support services saved on this device.</p>
    </div>
  </section>

  <section class="section" aria-labelledby="saved-resources-title">
    <div class="site-container">
      <div class="results-heading">
        <h2 id="saved-resources-title">Your saved services</h2>
        <p aria-live="polite">
          {{ savedResources.length }} {{ savedResources.length === 1 ? 'resource' : 'resources' }}
        </p>
      </div>

      <div v-if="savedResources.length" class="resource-grid">
        <ResourceCard
          v-for="resource in savedResources"
          :key="resource.id"
          :resource="resource"
        />
      </div>

      <div v-else class="empty-state">
        <Bookmark :size="30" aria-hidden="true" />
        <h3>No saved resources</h3>
        <p>Your saved public services will appear here.</p>
        <RouterLink class="button button--primary" to="/resources">
          Browse resources
        </RouterLink>
      </div>
    </div>
  </section>
</template>
