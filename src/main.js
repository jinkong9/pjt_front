import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './app/App.vue'
import router from './app/router'
import { createVueQueryClient, VueQueryPlugin } from './shared/query/vueQuery'
import './shared/styles/app.css'

const app = createApp(App)

app.use(createPinia())
app.use(VueQueryPlugin, { queryClient: createVueQueryClient() })
app.use(router)

app.mount('#app')
