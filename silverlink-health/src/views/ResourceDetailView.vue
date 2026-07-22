<script setup>
import { ArrowLeft, Clock, ExternalLink, MapPin, Phone } from '@lucide/vue'
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { getResourceById } from '../data/resources'

const route = useRoute()
const resource = computed(() => getResourceById(route.params.id))
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
            <p>Members can share a rating after signing in.</p>
            <RouterLink class="button button--secondary" to="/login">Log in to rate</RouterLink>
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
          <a
            class="button button--primary button--full"
            :href="resource.website"
            target="_blank"
            rel="noreferrer"
          >
            Visit website
            <ExternalLink :size="18" aria-hidden="true" />
          </a>
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
