<script setup>
import { WifiOff } from '@lucide/vue'
</script>

<template>
  <section class="status-page">
    <div class="site-container status-page__inner">
      <WifiOff :size="46" aria-hidden="true" />
      <p class="eyebrow">Offline</p>
      <h1>This page needs an internet connection.</h1>
      <p>Account and live service operations are unavailable while offline.</p>
      <div class="button-row">
        <RouterLink class="button button--primary" to="/saved">
          Open saved resources
        </RouterLink>
        <RouterLink class="button button--secondary" to="/resources">
          View directory
        </RouterLink>
      </div>
    </div>
  </section>
</template>
