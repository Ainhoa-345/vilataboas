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
        <button type="button" class="btn btn-outline-light btn-sm ms-1" @click="searchWeb" aria-label="Buscar en la web"><i class="bi bi-globe"></i></button>
      </form>

      <div class="dropdown ms-auto">
        <span class="text-white me-3" v-if="isLogueado">{{ userName }}</span>

        <!-- Cart icon linking to cesta -->
        <router-link to="/cesta" class="text-white me-3 d-flex align-items-center cart-link" aria-label="Cesta de la compra">
          <i class="bi bi-cart3 fs-4"></i>
          <span v-if="totalItems > 0" class="badge bg-danger ms-1">{{ totalItems }}</span>
        </router-link>

        <button class="btn btn-primary dropdown-toggle d-flex align-items-center" type="button" data-bs-toggle="dropdown" aria-expanded="false" aria-label="Menú de usuario">
          <!-- User avatar icon (inline SVG) -->
          <svg class="nav-user-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
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
          <li v-if="isLogueado"><router-link class="dropdown-item" to="/clientes">Perfil</router-link></li>
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

function searchWeb() {
  const termino = (searchTerm.value || '').trim()
  const q = encodeURIComponent(termino)
  // Abrir búsqueda en Google en nueva pestaña (busca en la web)
  const url = `https://www.google.com/search?q=${q}`
  window.open(url, '_blank')
}

function logout() {
  sessionStorage.removeItem('token')
  sessionStorage.removeItem('userName')

  isLogueado.value = false
  userName.value = ''

  window.location.href = '/'
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
</style>