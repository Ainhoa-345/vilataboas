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

// Remove or neutralize any dynamically-inserted <link rel="preload"> tags that use an
// unsupported `as` value. Some third-party widgets (Stripe/hCaptcha) may inject
// malformed preload links which trigger console warnings. This proactively removes
// such links to keep the console clean and avoid unexpected preload behavior.
;(function sanitizePreloadLinks(){
	const allowed = new Set(['script','style','image','font','fetch','document','embed','object','worker','audio','video','track'])

	function clean(link){
		try{
			if (!link || link.rel !== 'preload') return
			const as = (link.getAttribute('as') || '').toLowerCase()
			if (as && allowed.has(as)) return
			// if `as` is empty or not allowed, remove the element to avoid browser warnings
			link.parentNode && link.parentNode.removeChild(link)
		}catch(e){ /* ignore */ }
	}

	// Clean existing preload links
	document.querySelectorAll && document.querySelectorAll('link[rel="preload"]').forEach(clean)

	// Observe for newly added links (third-party scripts may add them later)
	try{
		const mo = new MutationObserver(muts => {
			for (const m of muts) {
				for (const n of m.addedNodes) {
					if (n && n.tagName === 'LINK' && n.rel === 'preload') clean(n)
				}
			}
		})
		mo.observe(document.head || document.documentElement, { childList: true, subtree: true })
	}catch(e){ /* older browsers may not support MutationObserver */ }
})()

app.use(pinia)
app.use(router)
// intentar enriquecer la cesta en el arranque (migración automática)
import { useCestaStore } from '@/store/cesta'
const store = useCestaStore(pinia)
// hydrateItems puede realizar peticiones; llamar sin await para no bloquear arranque
store.hydrateItems().catch(err => console.warn('Error hydrating cesta', err))

app.mount('#app')