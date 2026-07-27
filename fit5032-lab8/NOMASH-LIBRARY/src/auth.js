import { ref } from 'vue'


export const isAuthenticated = ref(false)

export function login() {
  isAuthenticated.value = true
}

export function logout() {
  isAuthenticated.value = false
}