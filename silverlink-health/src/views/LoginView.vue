<script setup>
import { LogIn } from '@lucide/vue'
import { ref } from 'vue'

const email = ref('')
const password = ref('')
const message = ref('')

function submitForm() {
  message.value = 'Secure sign-in will be connected during Firebase setup.'
}
</script>

<template>
  <section class="auth-page">
    <div class="auth-panel">
      <div class="auth-panel__heading">
        <p class="eyebrow">Member access</p>
        <h1>Log in</h1>
        <p>Access your saved account and resource ratings.</p>
      </div>

      <form class="form-stack" @submit.prevent="submitForm">
        <div class="form-field">
          <label for="login-email">Email address</label>
          <input id="login-email" v-model="email" type="email" autocomplete="email" required />
        </div>
        <div class="form-field">
          <label for="login-password">Password</label>
          <input
            id="login-password"
            v-model="password"
            type="password"
            autocomplete="current-password"
            required
          />
        </div>
        <button class="button button--primary button--full" type="submit">
          <LogIn :size="19" aria-hidden="true" />
          Log in
        </button>
        <p v-if="message" class="form-notice" role="status">{{ message }}</p>
      </form>

      <p class="auth-panel__switch">
        New to SilverLink Health?
        <RouterLink to="/register">Create an account</RouterLink>
      </p>
    </div>
  </section>
</template>
