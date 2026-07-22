<script setup>
import { ShieldX } from '@lucide/vue'
</script>

<template>
  <section class="status-page">
    <div class="site-container status-page__inner">
      <ShieldX :size="42" aria-hidden="true" />
      <p class="eyebrow">Access denied</p>
      <h1>You do not have permission to view this page.</h1>
      <p>Log in with an authorised account or return to the resource directory.</p>
      <div class="button-row">
        <RouterLink class="button button--primary" to="/login">Log in</RouterLink>
        <RouterLink class="button button--secondary" to="/resources">View resources</RouterLink>
      </div>
    </div>
  </section>
</template>
