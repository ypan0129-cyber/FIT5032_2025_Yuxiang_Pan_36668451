<script setup>
import { Bookmark, BookmarkCheck, ChevronRight, Clock, MapPin, Phone } from '@lucide/vue'
import { computed, ref } from 'vue'
import { useSavedResources } from '../services/savedResources'

const props = defineProps({
  resource: {
    type: Object,
    required: true,
  },
})

const saveError = ref('')
const { isResourceSaved, toggleSavedResource } = useSavedResources()
const isSaved = computed(() => isResourceSaved(props.resource.id))

function handleSaveToggle() {
  saveError.value = ''

  try {
    toggleSavedResource(props.resource.id)
  } catch {
    saveError.value = 'This resource could not be saved on this device.'
  }
}
</script>

<template>
  <article class="resource-card">
    <p class="resource-card__category">{{ resource.category }}</p>
    <h3>{{ resource.title }}</h3>
    <p class="resource-card__summary">{{ resource.summary }}</p>

    <dl class="resource-card__facts">
      <div v-if="resource.phone">
        <dt><Phone :size="18" aria-hidden="true" /><span class="sr-only">Phone</span></dt>
        <dd>{{ resource.phone }}</dd>
      </div>
      <div>
        <dt><MapPin :size="18" aria-hidden="true" /><span class="sr-only">Location</span></dt>
        <dd>{{ resource.location }}</dd>
      </div>
      <div>
        <dt><Clock :size="18" aria-hidden="true" /><span class="sr-only">Hours</span></dt>
        <dd>{{ resource.openingHours }}</dd>
      </div>
    </dl>

    <div class="resource-card__actions">
      <RouterLink class="text-link resource-card__link" :to="`/resources/${resource.id}`">
        View details
        <ChevronRight :size="19" aria-hidden="true" />
      </RouterLink>
      <button
        class="button button--quiet resource-save-button"
        type="button"
        :aria-pressed="isSaved"
        @click="handleSaveToggle"
      >
        <BookmarkCheck v-if="isSaved" :size="18" aria-hidden="true" />
        <Bookmark v-else :size="18" aria-hidden="true" />
        {{ isSaved ? 'Saved' : 'Save' }}
      </button>
    </div>
    <p v-if="saveError" class="resource-save-error" role="alert">{{ saveError }}</p>
  </article>
</template>
