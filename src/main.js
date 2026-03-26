import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import '@/assets/styles/global.css'
import 'swiper/css'
import 'swiper/css/navigation'
import 'swiper/css/pagination'

import VueApexCharts from 'vue3-apexcharts'


const app = createApp(App)

app.use(createPinia())
app.use(router)
app.use(VueApexCharts)
app.mount('#app')

