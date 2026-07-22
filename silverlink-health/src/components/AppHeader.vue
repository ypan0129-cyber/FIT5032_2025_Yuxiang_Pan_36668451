<script setup>
import { Menu, X } from '@lucide/vue'
import { ref, watch } from 'vue'
import { RouterLink, useRoute } from 'vue-router'

const isMenuOpen = ref(false)
const route = useRoute()

watch(
  () => route.fullPath,
  () => {
    isMenuOpen.value = false
  },
)
</script>

<template>
  <header class="site-header">
    <div class="site-container site-header__inner">
      <RouterLink class="brand" to="/" aria-label="SilverLink Health home">
        <span class="brand__mark" aria-hidden="true">S</span>
        <span>SilverLink Health</span>
      </RouterLink>

      <button
        class="icon-button menu-button"
        type="button"
        :aria-expanded="isMenuOpen"
        aria-controls="primary-navigation"
        :aria-label="isMenuOpen ? 'Close navigation' : 'Open navigation'"
        @click="isMenuOpen = !isMenuOpen"
      >
        <X v-if="isMenuOpen" :size="24" aria-hidden="true" />
        <Menu v-else :size="24" aria-hidden="true" />
      </button>

      <nav
        id="primary-navigation"
        class="primary-navigation"
        :class="{ 'primary-navigation--open': isMenuOpen }"
        aria-label="Primary navigation"
      >
        <div class="primary-navigation__links">
          <RouterLink to="/">Home</RouterLink>
          <RouterLink to="/resources">Resources</RouterLink>
        </div>
        <div class="primary-navigation__actions">
          <RouterLink class="button button--quiet" to="/login">Log in</RouterLink>
          <RouterLink class="button button--primary" to="/register">Create account</RouterLink>
        </div>
      </nav>
    </div>
  </header>
</template>
