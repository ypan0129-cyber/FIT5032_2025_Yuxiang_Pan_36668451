<script setup>
import { SearchX } from '@lucide/vue'
</script>

<template>
  <section class="status-page">
    <div class="site-container status-page__inner">
      <SearchX :size="42" aria-hidden="true" />
      <p class="eyebrow">Page not found</p>
      <h1>The page you requested does not exist.</h1>
      <p>Check the address or return to the SilverLink Health home page.</p>
      <RouterLink class="button button--primary" to="/">Return home</RouterLink>
    </div>
  </section>
</template>
