<script setup>
import { Bookmark, Wifi, WifiOff } from '@lucide/vue'
import { useConnectivity } from '../services/connectivity'
import { useSavedResources } from '../services/savedResources'

const { isOnline } = useConnectivity()
const { savedResources } = useSavedResources()
</script>

<template>
  <div class="connectivity-status" :class="{ 'connectivity-status--offline': !isOnline }">
    <div class="site-container connectivity-status__inner">
      <p role="status" aria-live="polite" aria-atomic="true">
        <Wifi v-if="isOnline" :size="17" aria-hidden="true" />
        <WifiOff v-else :size="17" aria-hidden="true" />
        <strong>{{ isOnline ? 'Online' : 'Offline' }}</strong>
      </p>
      <RouterLink to="/saved">
        <Bookmark :size="17" aria-hidden="true" />
        Saved resources ({{ savedResources.length }})
      </RouterLink>
    </div>
  </div>
</template>
