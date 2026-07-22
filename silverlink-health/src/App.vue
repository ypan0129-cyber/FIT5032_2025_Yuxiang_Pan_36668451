<script setup>
import { RouterView } from 'vue-router'
import AppFooter from './components/AppFooter.vue'
import AppHeader from './components/AppHeader.vue'
import EmergencyBanner from './components/EmergencyBanner.vue'
</script>

<template>
  <a class="skip-link" href="#main-content">Skip to main content</a>
  <EmergencyBanner />
  <AppHeader />
  <main id="main-content" tabindex="-1">
    <RouterView />
  </main>
  <AppFooter />
</template>
