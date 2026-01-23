import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from "./router"

import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap/dist/js/bootstrap.bundle.min.js'
import 'bootstrap-icons/font/bootstrap-icons.css'
import '@fortawesome/fontawesome-free/css/all.min.css'
import 'sweetalert2/dist/sweetalert2.min.css'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)
// intentar enriquecer la cesta en el arranque (migración automática)
import { useCestaStore } from '@/store/cesta'
const store = useCestaStore(pinia)
// hydrateItems puede realizar peticiones; llamar sin await para no bloquear arranque
store.hydrateItems().catch(err => console.warn('Error hydrating cesta', err))

app.mount('#app')