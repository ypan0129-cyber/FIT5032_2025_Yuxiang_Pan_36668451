<script setup>
import { LogOut, ShieldCheck, UserRound } from '@lucide/vue'
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { getAuthErrorMessage, signOut, useAuth } from '../auth'

const authState = useAuth()
const router = useRouter()
const isSigningOut = ref(false)
const signOutError = ref('')

const displayName = computed(
  () => authState.profile?.displayName || authState.user?.displayName || 'Member',
)

async function handleSignOut() {
  isSigningOut.value = true
  signOutError.value = ''

  try {
    await signOut()
    await router.replace('/')
  } catch (error) {
    signOutError.value = getAuthErrorMessage(error)
  } finally {
    isSigningOut.value = false
  }
}
</script>

<template>
  <section class="page-intro">
    <div class="site-container page-intro__inner">
      <p class="eyebrow">Member account</p>
      <h1>Your account</h1>
      <p>Review your sign-in details and account access.</p>
    </div>
  </section>

  <section class="section section--compact">
    <div class="site-container site-container--narrow account-layout">
      <article class="account-panel" aria-labelledby="profile-title">
        <div class="account-panel__heading">
          <UserRound :size="28" aria-hidden="true" />
          <div>
            <p class="eyebrow">Profile</p>
            <h2 id="profile-title">{{ displayName }}</h2>
          </div>
        </div>

        <dl class="account-details">
          <div>
            <dt>Email address</dt>
            <dd>{{ authState.user?.email }}</dd>
          </div>
          <div>
            <dt>Account role</dt>
            <dd><span class="role-badge">{{ authState.profile?.role || 'Member' }}</span></dd>
          </div>
        </dl>

        <p v-if="authState.profileError" class="form-notice form-notice--error" role="alert">
          {{ authState.profileError }}
        </p>

        <button
          class="button button--secondary"
          type="button"
          :disabled="isSigningOut"
          @click="handleSignOut"
        >
          <LogOut :size="19" aria-hidden="true" />
          {{ isSigningOut ? 'Logging out...' : 'Log out' }}
        </button>
        <p v-if="signOutError" class="form-notice form-notice--error" role="alert">
          {{ signOutError }}
        </p>
      </article>

      <aside class="account-note" aria-labelledby="account-security-title">
        <ShieldCheck :size="26" aria-hidden="true" />
        <h2 id="account-security-title">Your access is protected</h2>
        <p>
          New accounts receive member access. Staff access can only be assigned by an authorised
          administrator.
        </p>
        <RouterLink class="text-link" to="/resources">Browse support resources</RouterLink>
      </aside>
    </div>
  </section>
</template>
