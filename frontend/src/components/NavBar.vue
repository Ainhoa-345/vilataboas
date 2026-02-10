<template>
  <nav class="navbar navbar-expand-lg navbar-dark bg-primary ">
    <div class="container-fluid">
      <!-- Marca o logo -->
  <a class="navbar-brand" href="#"><img class="logo" src="@/assets/logoEmpresaTeis.svg" alt="logo" /></a>

      <!-- Botón de hamburguesa en pantallas pequeñas -->
      <button class="navbar-toggler" type="button" @click="toggleMenu"
        aria-controls="navbarNav" :aria-expanded="isMenuOpen" aria-label="Toggle navigation">
        <span class="navbar-toggler-icon"></span>
      </button>

      <!-- Links de navegación -->
      <div class="collapse navbar-collapse justify-content-center" id="navbarNav">
        <ul class="navbar-nav d-flex justify-content-center w-100">
          <li class="nav-item">
            <router-link class="nav-link" to="/">Inicio</router-link>
          </li>
          <li v-if="isAdmin" class="nav-item">
            <router-link class="nav-link" to="/clientes">Clientes</router-link>
          </li>
          <li class="nav-item">
            <router-link class="nav-link" to="/noticias">Noticias</router-link>
          </li>
          <li v-if="isAdmin" class="nav-item">
            <router-link class="nav-link" to="/taller">Taller</router-link>
          </li>
          <li v-if="isAdmin" class="nav-item">
            <router-link class="nav-link" to="/modelos">Modelos</router-link>
          </li>
          <li class="nav-item">
            <router-link class="nav-link" to="/ventas">Ventas</router-link>
          </li>
          <li class="nav-item">
            <router-link class="nav-link" to="/contacto">Contacto</router-link>
          </li>
        </ul>
      </div>

      <form @submit.prevent="searchInternal" class="d-flex ms-3 me-2" role="search">
        <input v-model="searchTerm" class="form-control form-control-sm me-2" type="search" placeholder="Buscar..." aria-label="Buscar" />
        <button class="btn btn-outline-light btn-sm" type="submit" aria-label="Buscar interno"><i class="bi bi-search"></i></button>
      </form>

  <!-- Cart icon linking to cesta: visible para invitados y usuarios (permite acceder a la cesta como guest) -->
  <router-link to="/cesta" class="text-white me-3 d-flex align-items-center cart-link" aria-label="Cesta de la compra">
          <i class="bi bi-cart3 cart-icon" aria-hidden="true"></i>
          <span v-if="totalItems > 0" class="badge bg-danger cart-badge">{{ totalItems }}</span>
        </router-link>
      <div class="dropdown ms-auto">
        <span class="text-white me-3" v-if="isLogueado">{{ userName }}</span>

        <button class="btn btn-primary dropdown-toggle d-flex align-items-center" type="button" data-bs-toggle="dropdown" aria-expanded="false" aria-label="Menú de usuario">
          <!-- User avatar icon (inline SVG) -->
          <svg class="nav-user-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false" @click="goPerfil" style="cursor: pointer;">
            <circle cx="12" cy="8" r="3.2" fill="currentColor" />
            <path d="M4 20c0-3.3 2.7-6 6-6h4c3.3 0 6 2.7 6 6v1H4v-1z" fill="currentColor" opacity="0.9" />
          </svg>
        </button>
  <ul class="dropdown-menu dropdown-menu-end">
          <!-- Mostra “Acceso/Registro” se NON hai usuario logueado -->
          <li v-if="!isLogueado"><router-link class="dropdown-item" to="/login">Acceso</router-link></li>
          <li v-if="!isLogueado"><router-link class="dropdown-item" to="/clientes">Registro</router-link></li>
          <!-- Mostra “Cerrar Sesión” se está logueado -->
          <li v-if="isLogueado">
            <a class="dropdown-item" href="#" @click.prevent="logout">Cerrar Sesión</a>
          </li>
          <li v-if="isLogueado"><router-link class="dropdown-item" to="/perfil">Perfil</router-link></li>
        </ul>
      </div>
      
    </div>
  </nav>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { checkAdmin } from '@/api/authApi.js'
import { useCestaStore } from '@/store/cesta'

const isLogueado = ref(false)
const userName = ref('')
const isAdmin = ref(false)
const isMenuOpen = ref(false)
const cestaStore = useCestaStore()
const router = useRouter()
const searchTerm = ref('')

const totalItems = computed(() => cestaStore.totalItems)

onMounted(async () => {
  isLogueado.value = sessionStorage.getItem('token') !== null
  
  // Verificar si es admin mediante API
  const adminCheck = await checkAdmin();  
  isAdmin.value = adminCheck.isAdmin;
  userName.value = adminCheck.name;
})

function toggleMenu() {
  isMenuOpen.value = !isMenuOpen.value
  const navbarCollapse = document.getElementById('navbarNav')
  if (navbarCollapse) {
    if (isMenuOpen.value) {
      navbarCollapse.classList.add('show')
    } else {
      navbarCollapse.classList.remove('show')
    }
  }
}

function searchInternal() {
  const termino = (searchTerm.value || '').trim()
  // Navegar al componente Buscar (ruta /buscar) con query q
  router.push({ path: '/buscar', query: { q: termino } })
}


function logout() {
  try {
    // Preserve the current user's cesta so it is not lost on logout.
    // Use DNI as stable identifier; fall back to token for compatibility.
    const dni = sessionStorage.getItem('dni');
    const token = sessionStorage.getItem('token');
    const userId = dni || token;
    if (userId && typeof localStorage !== 'undefined') {
      const userKey = `cesta_${userId}`;
      const userRaw = localStorage.getItem(userKey);

      if (userRaw) {
        // Only copy the user's cesta to guest if there is no guest cesta yet.
        // Avoid merging/summing quantities to prevent duplicates when the user
        // logs out and logs back in repeatedly (that would double counts).
        const guestRaw = localStorage.getItem('cesta_guest');
        if (!guestRaw) {
          try {
            localStorage.setItem('cesta_guest', userRaw);
          } catch (e) {
            console.warn('logout: error copying user cesta to guest', e);
          }
        } else {
          // If guest cart already exists, do not merge to avoid repeated doubling.
          // We intentionally leave guest cart untouched.
        }
      }
    }
  } catch (e) {
    console.warn('logout: error preserving cesta', e);
  }

  // Remove only session identifiers; do NOT delete localStorage cesta entries so user's cart persists
  sessionStorage.removeItem('token')
  sessionStorage.removeItem('userName')
  sessionStorage.removeItem('dni')

  isLogueado.value = false
  userName.value = ''

  // Refresh to reflect logout state
  window.location.href = '/'
}

function goPerfil() {
  // Navegar a la página de edición de perfil
  try {
    router.push('/perfil');
  } catch (e) {
    console.warn('goPerfil: error navegando a /perfil', e);
  }
}
</script>

<style scoped>
.navbar {
  width: 100%;
  left: 0;
  top: 0;
  z-index: 1000;
}

.navbar-nav {
  gap: 1rem;
  /* espacio entre links */
}

.nav-link {
  text-align: center;
}

  .logo {
  width: 45px;
}

/* User icon in navbar dropdown button */
.nav-user-icon {
  width: 34px;
  height: 34px;
  color: white; /* uses currentColor fill */
}

.btn.btn-primary.dropdown-toggle .nav-user-icon {
  /* ensure icon contrasts on primary button */
  color: white;
}

/* Cart: make same size as user icon and position left of it */
.cart-link {
  /* Rounded square container behind the cart icon */
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 40px;
  min-height: 40px;
  padding: 6px;
  box-sizing: border-box;
  border-radius: 8px;
  border: 1px solid rgba(255,255,255,0.22);
  background: rgba(255,255,255,0.04);
  color: white;
  position: relative;
  margin-right: 0.3rem !important;
  transition: transform 120ms ease, box-shadow 120ms ease, background 120ms ease;
  box-shadow: 0 1px 0 rgba(0,0,0,0.05);
}

.cart-link:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 12px rgba(0,0,0,0.12);
  background: rgba(255,255,255,0.06);
}

.cart-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  font-size: 18px;
  color: white;
}

.cart-badge {
  position: absolute;
  top: 0;
  right: 0;
  transform: translate(50%, -50%);
  font-size: 0.65rem;
  padding: 0;
  border-radius: 50%;
  min-width: 18px;
  height: 18px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: #ff3b30; /* bright red */
  color: white;
  border: 2px solid white; /* small white border to separate from blue background */
}

@media (max-width: 576px) {
  .cart-link {
    min-width: 36px;
    min-height: 36px;
    padding: 4px;
    margin-right: 0.2rem !important;
  }
  .cart-icon { width: 20px; height: 20px; font-size: 16px }
  .cart-badge { min-width: 16px; height: 16px; font-size: 0.6rem }
}
</style>