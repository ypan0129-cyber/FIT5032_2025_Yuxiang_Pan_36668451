import 'bootstrap/dist/css/bootstrap.min.css'

import { createApp } from 'vue'
import App from './App.vue'
import router from './router'

import PrimeVue from 'primevue/config'
import Aura from '@primevue/themes/aura'

import { initializeApp } from "firebase/app";
const firebaseConfig = {
  apiKey: "AIzaSyDW2DD68d-plb2pPrW25aDt1KkcIhBPD7U",
  authDomain: "fit5032-lab7-9f072.firebaseapp.com",
  projectId: "fit5032-lab7-9f072",
  storageBucket: "fit5032-lab7-9f072.firebasestorage.app",
  messagingSenderId: "790895442209",
  appId: "1:790895442209:web:e5869937449a22db656660"
};

// 初始化 Firebase
initializeApp(firebaseConfig);

const app = createApp(App)
app.use(PrimeVue, { theme: { preset: Aura } })
app.use(router)

app.mount('#app')
