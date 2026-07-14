import { createApp } from 'vue'
import App from './App.vue'

// 引入 Bootstrap CSS (保留你原有的)
import 'bootstrap/dist/css/bootstrap.min.css'

// 1. 引入 PrimeVue 和 Aura 主题 (根据你的截图)
import PrimeVue from 'primevue/config';
import Aura from '@primevue/themes/aura';

const app = createApp(App);

// 2. 使用 PrimeVue 并配置 Aura 主题
app.use(PrimeVue, {
    theme: {
        preset: Aura,
        options: {
            darkModeSelector: '.p-dark' // 更改深色模式的触发条件，从而关闭自动深色模式
        }
    }
    
});

app.mount('#app');