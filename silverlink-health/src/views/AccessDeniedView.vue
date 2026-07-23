<script setup>
import { ShieldX } from '@lucide/vue'
import { useAuth } from '../auth'

const authState = useAuth()
</script>

<template>
  <section class="status-page">
    <div class="site-container status-page__inner">
      <ShieldX :size="42" aria-hidden="true" />
      <p class="eyebrow">Staff access required</p>
      <h1>You do not have permission to view this page.</h1>
      <p v-if="authState.user">
        Your signed-in account does not have the staff role required for this page.
      </p>
      <p v-else>Log in with an authorised staff account or return to the resource directory.</p>
      <div class="button-row">
        <RouterLink v-if="authState.user" class="button button--primary" to="/account">
          View account
        </RouterLink>
        <RouterLink v-else class="button button--primary" to="/login">Log in</RouterLink>
        <RouterLink class="button button--secondary" to="/resources">View resources</RouterLink>
      </div>
    </div>
  </section>
</template>
