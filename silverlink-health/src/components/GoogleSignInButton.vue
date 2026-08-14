<script setup>
import { LogIn } from '@lucide/vue'
import { ref } from 'vue'
import { signInWithGoogle } from '../auth'

defineProps({
  disabled: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['busy-change', 'error', 'success'])
const isBusy = ref(false)

async function handleGoogleSignIn() {
  if (isBusy.value) return

  isBusy.value = true
  emit('busy-change', true)

  try {
    const user = await signInWithGoogle()
    emit('success', user)
  } catch (error) {
    emit('error', error)
  } finally {
    isBusy.value = false
    emit('busy-change', false)
  }
}
</script>

<template>
  <button
    class="button button--provider button--full"
    type="button"
    :disabled="disabled || isBusy"
    :aria-busy="isBusy"
    @click="handleGoogleSignIn"
  >
    <LogIn :size="19" aria-hidden="true" />
    {{ isBusy ? 'Connecting to Google...' : 'Continue with Google' }}
  </button>
</template>
