<script setup>
import { RouterView } from 'vue-router'
import AppFooter from './components/AppFooter.vue'
import AppHeader from './components/AppHeader.vue'
import ConnectivityStatus from './components/ConnectivityStatus.vue'
import EmergencyBanner from './components/EmergencyBanner.vue'
import { focusMainContent } from './utils/accessibility'

function handleSkipLink(event) {
  event.preventDefault()
  const main = document.getElementById('main-content')

  if (focusMainContent(document)) {
    main?.scrollIntoView({ block: 'start' })
  }
}
</script>

<template>
  <a class="skip-link" href="#main-content" @click="handleSkipLink">Skip to main content</a>
  <EmergencyBanner />
  <AppHeader />
  <ConnectivityStatus />
  <main id="main-content" tabindex="-1">
    <RouterView />
  </main>
  <AppFooter />
</template>
