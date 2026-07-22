<script setup>
import { ChevronRight, Clock, MapPin, Phone } from '@lucide/vue'

defineProps({
  resource: {
    type: Object,
    required: true,
  },
})
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

    <RouterLink class="text-link resource-card__link" :to="`/resources/${resource.id}`">
      View details
      <ChevronRight :size="19" aria-hidden="true" />
    </RouterLink>
  </article>
</template>
