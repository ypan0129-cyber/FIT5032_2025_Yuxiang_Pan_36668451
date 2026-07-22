<script setup>
import { ArrowRight, HeartHandshake, Search, ShieldCheck } from '@lucide/vue'
import ResourceCard from '../components/ResourceCard.vue'
import communitySupportImage from '../assets/community-support.jpg'
import { resources } from '../data/resources'

const featuredResources = resources.filter((resource) => resource.featured)
</script>

<template>
  <section class="home-hero" aria-labelledby="home-title">
    <img
      class="home-hero__image"
      :src="communitySupportImage"
      alt="Two older adults sitting together and looking across the coast"
    />
    <div class="home-hero__overlay" aria-hidden="true"></div>
    <div class="site-container home-hero__content">
      <p class="eyebrow">Mental health support for older Australians</p>
      <h1 id="home-title">Support should be easier to find.</h1>
      <p>
        Find trusted services for anxiety, grief, loneliness, sleep and emotional wellbeing.
      </p>
      <RouterLink class="button button--light" to="/resources">
        Find support
        <ArrowRight :size="20" aria-hidden="true" />
      </RouterLink>
    </div>
  </section>

  <section class="section section--compact" aria-labelledby="ways-title">
    <div class="site-container">
      <div class="section-heading">
        <p class="eyebrow">Start with what matters to you</p>
        <h2 id="ways-title">A clear path to the right support</h2>
      </div>
      <div class="service-steps">
        <article>
          <Search :size="26" aria-hidden="true" />
          <h3>Find suitable services</h3>
          <p>Search by concern, support type or the way you prefer to connect.</p>
        </article>
        <article>
          <HeartHandshake :size="26" aria-hidden="true" />
          <h3>Compare your options</h3>
          <p>Read plain-language service details before deciding what feels right.</p>
        </article>
        <article>
          <ShieldCheck :size="26" aria-hidden="true" />
          <h3>Choose with confidence</h3>
          <p>Access established Australian organisations and clear contact information.</p>
        </article>
      </div>
    </div>
  </section>

  <section class="section section--muted" aria-labelledby="featured-title">
    <div class="site-container">
      <div class="section-heading section-heading--split">
        <div>
          <p class="eyebrow">Featured support</p>
          <h2 id="featured-title">Services available across Australia</h2>
        </div>
        <RouterLink class="text-link" to="/resources">
          View all resources
          <ArrowRight :size="19" aria-hidden="true" />
        </RouterLink>
      </div>
      <div class="resource-grid">
        <ResourceCard
          v-for="resource in featuredResources"
          :key="resource.id"
          :resource="resource"
        />
      </div>
    </div>
  </section>
</template>
