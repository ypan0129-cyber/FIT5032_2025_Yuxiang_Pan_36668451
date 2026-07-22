<script setup>
import { RouterLink } from 'vue-router'
</script>

<template>
  <footer class="site-footer">
    <div class="site-container site-footer__grid">
      <div>
        <p class="site-footer__brand">SilverLink Health</p>
        <p class="site-footer__copy">
          A simple guide to mental health support for older Australians.
        </p>
      </div>
      <nav class="site-footer__links" aria-label="Footer navigation">
        <RouterLink to="/">Home</RouterLink>
        <RouterLink to="/resources">Resources</RouterLink>
        <RouterLink to="/login">Log in</RouterLink>
      </nav>
    </div>
    <div class="site-container site-footer__legal">
      <p>Information on this website does not replace professional medical advice.</p>
      <p>&copy; 2026 SilverLink Health</p>
    </div>
  </footer>
</template>
