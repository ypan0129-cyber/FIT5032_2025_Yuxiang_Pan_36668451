<script setup>
import { Phone } from '@lucide/vue'
</script>

<template>
  <aside class="emergency-banner" aria-label="Emergency support">
    <div class="site-container emergency-banner__inner">
      <Phone :size="20" aria-hidden="true" />
      <p>
        In immediate danger? Call <a href="tel:000">000</a>. For 24/7 crisis support, call
        Lifeline on <a href="tel:131114">13 11 14</a>.
      </p>
    </div>
  </aside>
</template>
