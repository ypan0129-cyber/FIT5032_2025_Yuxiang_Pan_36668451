import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import { initialiseAuth } from './auth'
import router from './router'

async function startApp() {
  await initialiseAuth()
  createApp(App).use(router).mount('#app')
}

startApp()
