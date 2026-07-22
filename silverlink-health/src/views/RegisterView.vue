<script setup>
import { UserPlus } from '@lucide/vue'
import { reactive, ref } from 'vue'

const form = reactive({
  displayName: '',
  email: '',
  password: '',
  confirmPassword: '',
})
const message = ref('')

function submitForm() {
  if (form.password !== form.confirmPassword) {
    message.value = 'Passwords do not match.'
    return
  }

  message.value = 'Secure registration will be connected during Firebase setup.'
}
</script>

<template>
  <section class="auth-page">
    <div class="auth-panel auth-panel--wide">
      <div class="auth-panel__heading">
        <p class="eyebrow">Free member account</p>
        <h1>Create an account</h1>
        <p>Register to rate services and keep track of your feedback.</p>
      </div>

      <form class="form-stack" @submit.prevent="submitForm">
        <div class="form-field">
          <label for="register-name">Full name</label>
          <input id="register-name" v-model="form.displayName" type="text" autocomplete="name" required />
        </div>
        <div class="form-field">
          <label for="register-email">Email address</label>
          <input id="register-email" v-model="form.email" type="email" autocomplete="email" required />
        </div>
        <div class="form-field">
          <label for="register-password">Password</label>
          <input
            id="register-password"
            v-model="form.password"
            type="password"
            autocomplete="new-password"
            minlength="8"
            required
          />
          <p class="field-hint">Use at least 8 characters.</p>
        </div>
        <div class="form-field">
          <label for="register-confirm">Confirm password</label>
          <input
            id="register-confirm"
            v-model="form.confirmPassword"
            type="password"
            autocomplete="new-password"
            minlength="8"
            required
          />
        </div>
        <button class="button button--primary button--full" type="submit">
          <UserPlus :size="19" aria-hidden="true" />
          Create account
        </button>
        <p v-if="message" class="form-notice" role="status">{{ message }}</p>
      </form>

      <p class="auth-panel__switch">
        Already have an account?
        <RouterLink to="/login">Log in</RouterLink>
      </p>
    </div>
  </section>
</template>
