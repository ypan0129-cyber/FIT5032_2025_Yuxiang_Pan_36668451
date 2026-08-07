<template>
  <div class="login-container card p-4 mx-auto mt-5" style="max-width: 400px;">
    <h2 class="text-center mb-4">Library Login</h2>
    <form @submit.prevent="handleLogin">
      <div class="mb-3">
        <label for="username" class="form-label">Username</label>
        <input
          type="text"
          class="form-control"
          id="username"
          v-model="username"
          placeholder="Enter 'admin'"
          required
        />
      </div>
      <div class="mb-3">
        <label for="password" class="form-label">Password</label>
        <input
          type="password"
          class="form-control"
          id="password"
          v-model="password"
          placeholder="Enter 'password123'"
          required
        />
      </div>
      <div v-if="errorMessage" class="alert alert-danger p-2 text-center small">
        {{ errorMessage }}
      </div>
      <button type="submit" class="btn btn-primary w-100">Login</button>
    </form>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { login } from '../auth' // 引入我们创建的登录状态方法

const username = ref('')
const password = ref('')
const errorMessage = ref('')
const router = useRouter()

const handleLogin = () => {
  // 使用题目要求的硬编码账号密码
  if (username.value === 'admin' && password.value === 'password123') {
    login() // 更新全局状态为已登录
    errorMessage.value = ''
    // 登录成功后跳转到 About 页面
    router.push('/about')
  } else {
    errorMessage.value = 'Invalid username or password!'
  }
}
</script>