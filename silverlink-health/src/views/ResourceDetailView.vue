<script setup>
import {
  ArrowLeft,
  Bookmark,
  BookmarkCheck,
  Clock,
  ExternalLink,
  MapPin,
  Phone,
  WifiOff,
} from '@lucide/vue'
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import ResourceRating from '../components/ResourceRating.vue'
import { getResourceById } from '../data/resources'
import { useConnectivity } from '../services/connectivity'
import { useSavedResources } from '../services/savedResources'

const route = useRoute()
const resource = computed(() => getResourceById(route.params.id))
const saveError = ref('')
const { isOnline } = useConnectivity()
const { isResourceSaved, toggleSavedResource } = useSavedResources()
const isSaved = computed(() => resource.value && isResourceSaved(resource.value.id))

function handleSaveToggle() {
  saveError.value = ''

  try {
    toggleSavedResource(resource.value.id)
  } catch {
    saveError.value = 'This resource could not be saved on this device.'
  }
}
</script>

<template>
  <section v-if="resource" class="section resource-detail">
    <div class="site-container site-container--narrow">
      <RouterLink class="back-link" to="/resources">
        <ArrowLeft :size="19" aria-hidden="true" />
        Back to resources
      </RouterLink>

      <div class="resource-detail__heading">
        <p class="eyebrow">{{ resource.category }}</p>
        <h1>{{ resource.title }}</h1>
        <p>{{ resource.summary }}</p>
      </div>

      <div class="resource-detail__layout">
        <article class="resource-detail__content">
          <h2>About this service</h2>
          <p>{{ resource.description }}</p>

          <h2>Support options</h2>
          <ul class="tag-list" aria-label="Available support methods">
            <li v-for="mode in resource.deliveryModes" :key="mode">{{ mode }}</li>
          </ul>

          <section class="rating-preview" aria-labelledby="rating-title">
            <h2 id="rating-title">Helpfulness rating</h2>
            <ResourceRating v-if="isOnline" :resource-id="resource.id" />
            <p v-else class="form-notice" role="status">
              Ratings are unavailable while offline.
            </p>
          </section>
        </article>

        <aside class="contact-card" aria-labelledby="contact-title">
          <h2 id="contact-title">Contact details</h2>
          <dl>
            <div v-if="resource.phone">
              <dt><Phone :size="20" aria-hidden="true" /> Phone</dt>
              <dd><a :href="`tel:${resource.phone.replace(/\s/g, '')}`">{{ resource.phone }}</a></dd>
            </div>
            <div>
              <dt><Clock :size="20" aria-hidden="true" /> Hours</dt>
              <dd>{{ resource.openingHours }}</dd>
            </div>
            <div>
              <dt><MapPin :size="20" aria-hidden="true" /> Location</dt>
              <dd>{{ resource.location }}</dd>
            </div>
          </dl>
          <button
            class="button button--secondary button--full resource-detail__save"
            type="button"
            :aria-pressed="isSaved"
            @click="handleSaveToggle"
          >
            <BookmarkCheck v-if="isSaved" :size="18" aria-hidden="true" />
            <Bookmark v-else :size="18" aria-hidden="true" />
            {{ isSaved ? 'Saved on this device' : 'Save on this device' }}
          </button>
          <p v-if="saveError" class="resource-save-error" role="alert">{{ saveError }}</p>
          <a
            v-if="isOnline"
            class="button button--primary button--full"
            :href="resource.website"
            target="_blank"
            rel="noopener noreferrer"
          >
            Visit website
            <span class="sr-only"> (opens in a new tab)</span>
            <ExternalLink :size="18" aria-hidden="true" />
          </a>
          <span v-else class="button button--quiet button--full offline-action" aria-disabled="true">
            <WifiOff :size="18" aria-hidden="true" />
            Website unavailable offline
          </span>
        </aside>
      </div>
    </div>
  </section>

  <section v-else class="status-page">
    <div class="site-container status-page__inner">
      <p class="eyebrow">Resource not found</p>
      <h1>We could not find that service.</h1>
      <p>The resource may have moved or is no longer listed.</p>
      <RouterLink class="button button--primary" to="/resources">View all resources</RouterLink>
    </div>
  </section>
</template>
