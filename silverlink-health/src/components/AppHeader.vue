<script setup>
import { LogOut, Menu, UserRound, X } from '@lucide/vue'
import { ref, watch } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { signOut, useAuth } from '../auth'

const isMenuOpen = ref(false)
const isSigningOut = ref(false)
const route = useRoute()
const router = useRouter()
const authState = useAuth()

async function handleSignOut() {
  isSigningOut.value = true

  try {
    await signOut()
    await router.push('/')
  } finally {
    isSigningOut.value = false
  }
}

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
          <RouterLink to="/nearby">Nearby services</RouterLink>
          <RouterLink v-if="authState.profile?.role === 'member'" to="/support-plan">
            Support plan
          </RouterLink>
          <RouterLink v-if="authState.profile?.role === 'staff'" to="/staff">Staff</RouterLink>
          <RouterLink v-if="authState.profile?.role === 'admin'" to="/admin">
            Administration
          </RouterLink>
        </div>
        <div class="primary-navigation__actions">
          <template v-if="authState.user">
            <RouterLink class="button button--quiet" to="/account">
              <UserRound :size="19" aria-hidden="true" />
              Account
            </RouterLink>
            <button
              class="button button--primary"
              type="button"
              :disabled="isSigningOut"
              @click="handleSignOut"
            >
              <LogOut :size="19" aria-hidden="true" />
              {{ isSigningOut ? 'Logging out...' : 'Log out' }}
            </button>
          </template>
          <template v-else>
            <RouterLink class="button button--quiet" to="/login">Log in</RouterLink>
            <RouterLink class="button button--primary" to="/register">Create account</RouterLink>
          </template>
        </div>
      </nav>
    </div>
  </header>
</template>
