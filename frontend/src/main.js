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

// Eliminar o neutralizar cualquier etiqueta <link rel="preload"> insertada dinámicamente que use un
// valor `as` no soportado. Algunos widgets de terceros (Stripe/hCaptcha) pueden inyectar
// enlaces preload malformados que generan warnings en consola. Esto los elimina proactivamente
// para mantener la consola limpia y evitar comportamiento de precarga inesperado.
;(function sanitizePreloadLinks(){
	const allowed = new Set(['script','style','image','font','fetch','document','embed','object','worker','audio','video','track'])

	function clean(link){
		try{
			if (!link || link.rel !== 'preload') return
			const as = (link.getAttribute('as') || '').toLowerCase()
			if (as && allowed.has(as)) return
			// si `as` está vacío o no es permitido, eliminar el elemento para evitar warnings del navegador
			link.parentNode && link.parentNode.removeChild(link)
		}catch(e){ /* ignorar */ }
	}

	// Limpiar enlaces preload existentes
	document.querySelectorAll && document.querySelectorAll('link[rel="preload"]').forEach(clean)

	// Observar enlaces añadidos posteriormente (scripts de terceros pueden añadirlos después)
	try{
		const mo = new MutationObserver(muts => {
			for (const m of muts) {
				for (const n of m.addedNodes) {
					if (n && n.tagName === 'LINK' && n.rel === 'preload') clean(n)
				}
			}
		})
		mo.observe(document.head || document.documentElement, { childList: true, subtree: true })
	}catch(e){ /* navegadores antiguos pueden no soportar MutationObserver */ }
})()

app.use(pinia)
app.use(router)
// intentar enriquecer la cesta en el arranque (migración automática)
import { useCestaStore } from '@/store/cesta'
const store = useCestaStore(pinia)
// hydrateItems puede realizar peticiones; llamar sin await para no bloquear arranque
store.hydrateItems().catch(err => console.warn('Error al hidratar la cesta', err))

app.mount('#app')