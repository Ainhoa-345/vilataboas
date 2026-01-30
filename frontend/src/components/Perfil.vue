<template>
  <div class="container mt-4">
    <h3>Mi perfil</h3>
    <div v-if="loading" class="text-muted">Cargando...</div>
    <div v-else-if="!model" class="text-danger">No se han podido cargar los datos del perfil.</div>
      <form v-else @submit.prevent="guardar" class="mt-3">
      <div class="row">
        <div class="col-md-6 mb-3">
          <label class="form-label">DNI</label>
          <input class="form-control" v-model="model.dni" disabled />
        </div>
        <div class="col-md-6 mb-3">
          <label class="form-label">Email</label>
          <input class="form-control" v-model="model.email" type="email" required />
        </div>
      </div>

      <div class="row">
        <div class="col-md-6 mb-3">
          <label class="form-label">Nombre</label>
          <input class="form-control" v-model="model.nombre" required />
        </div>
        <div class="col-md-6 mb-3">
          <label class="form-label">Apellidos</label>
          <input class="form-control" v-model="model.apellidos" />
        </div>
      </div>

      <div class="row">
        <div class="col-md-6 mb-3">
          <label class="form-label">Móvil</label>
          <input class="form-control" v-model="model.movil" />
        </div>
        <div class="col-md-6 mb-3">
          <label class="form-label">Dirección</label>
          <input class="form-control" v-model="model.direccion" />
        </div>
      </div>

      <div class="row">
        <div class="col-md-4 mb-3">
          <label class="form-label">Provincia</label>
          <input class="form-control" v-model="model.provincia" />
        </div>
        <div class="col-md-4 mb-3">
          <label class="form-label">Municipio</label>
          <input class="form-control" v-model="model.municipio" />
        </div>
      </div>

      <div class="mb-3">
        <label class="form-label">Cambiar contraseña (dejar vacío para conservar)</label>
        <input class="form-control" v-model="password" type="password" placeholder="Nueva contraseña" />
      </div>

      <div class="d-flex gap-2">
        <button class="btn btn-primary" type="submit" :disabled="saving">Guardar</button>
        <button class="btn btn-secondary" type="button" @click="cancelar">Cancelar</button>
      </div>
    </form>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import Swal from 'sweetalert2'
import { getClienteLogueado, getClientePorDni, updateCliente } from '@/api/clientes.js'

const router = useRouter()
const loading = ref(true)
const saving = ref(false)
const model = ref(null)
const password = ref('')

async function load() {
  loading.value = true
  try {
    // intentar obtener cliente logueado via token (incluimos token en el helper)
    try {
      const res = await getClienteLogueado()
      model.value = { ...res }
    } catch (err) {
      // fallback: intentar por dni en sessionStorage
      const dni = sessionStorage.getItem('dni')
      if (!dni) {
        console.error('No hay token ni dni en sessionStorage');
        model.value = null;
        return;
      }
      try {
        const res2 = await getClientePorDni(dni)
        model.value = { ...res2 }
      } catch (err2) {
        console.error('Error buscando cliente por dni:', err2)
        model.value = null;
        return;
      }
    }
  } catch (e) {
    console.error('Error cargando perfil:', e)
    Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudo cargar el perfil.' })
    router.push('/')
  } finally {
    loading.value = false
  }
}

onMounted(load)

async function guardar() {
  if (!model.value || !model.value.id) return;
  saving.value = true
  try {
    const payload = { ...model.value }
    // manejar password: si no se especifica, enviar cadena vacía para que el backend la preserve
    payload.password = password.value && password.value.trim() !== '' ? password.value : ''

    await updateCliente(payload.id || payload.id, payload)
    Swal.fire({ icon: 'success', title: 'Perfil guardado', timer: 1500, showConfirmButton: false })
    password.value = ''
  } catch (e) {
    console.error('Error guardando perfil:', e)
    Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudo guardar el perfil.' })
  } finally {
    saving.value = false
  }
}

function cancelar() {
  router.push('/')
}
</script>

<style scoped>
.container { max-width: 900px; }
</style>
