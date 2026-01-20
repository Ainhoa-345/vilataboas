<template>
  <div class="container mt-4">
    <h3>Tu Cesta</h3>

    <div v-if="items.length === 0" class="alert alert-info">Tu cesta está vacía.</div>

    <div v-else>
      <div v-if="mensaje" class="alert alert-success" role="alert">{{ mensaje }}</div>
      <div class="list-group">
            <div v-for="item in items" :key="item.id" class="list-group-item d-flex justify-content-between align-items-center">
          <div class="d-flex align-items-center">
            <img :src="resolveImagen(item.imagen)" alt="img" style="width:60px; height:60px; object-fit:cover; margin-right:12px;"/>
            <div>
              <div class="fw-bold">{{ item.nombre }}</div>
              <div class="text-muted">{{ item.precio }}€</div>
            </div>
          </div>

            <div class="d-flex align-items-center">
            <button class="btn btn-sm btn-outline-secondary me-2" @click="decrementar(item.id)">-</button>
            <span class="mx-2">{{ item.cantidad }}</span>
            <button class="btn btn-sm btn-outline-secondary ms-2" @click="incrementar(item.id)">+</button>
            <button class="btn btn-sm btn-danger ms-3" @click="onRemove(item.id)">🗑️ Eliminar</button>
          </div>
        </div>
      </div>

      <div class="mt-3 d-flex justify-content-between align-items-center">
        <div>
          <strong>Total items:</strong> {{ totalItems }}
        </div>
        <div>
          <strong>Total precio:</strong> {{ totalPrecio }}€
        </div>
      </div>

      <div class="mt-3">
        <button class="btn btn-secondary me-2" @click="clearCesta">Vaciar cesta</button>
        <button class="btn btn-primary" @click="procederPago">Proceder al pago</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useCestaStore } from '@/store/cesta'
import { useRouter } from 'vue-router'
import { computed, ref } from 'vue'
import placeholderImg from '@/assets/404.jpg'

const cesta = useCestaStore()
const router = useRouter()

// usar computed para asegurar reactividad en la plantilla
const items = computed(() => cesta.items)
const totalItems = computed(() => cesta.totalItems)
const totalPrecio = computed(() => cesta.totalPrecio)

const mensaje = ref('')
let mensajeTimer = null

const resolveImagen = (ruta) => {
  if (!ruta) return placeholderImg;
  if (ruta.startsWith('/public/')) return ruta.replace(/^\/public/, '');
  if (ruta.startsWith('/uploads')) return `http://localhost:5000${ruta}`;
  if (ruta.startsWith('http://') || ruta.startsWith('https://')) return ruta;
  if (ruta.startsWith('/')) return ruta;
  return placeholderImg;
}

function incrementar(id){
  cesta.incrementar(id)
}
function decrementar(id){
  cesta.decrementar(id)
}
function onRemove(id){
  const prod = cesta.items.find(i => i.id === id)
  cesta.removeProducto(id)
  // mostrar un mensaje breve de confirmación
  if (prod) {
    mensaje.value = `${prod.nombre} eliminado de la cesta`
    clearTimeout(mensajeTimer)
    mensajeTimer = setTimeout(() => mensaje.value = '', 2500)
  }
}
function clearCesta(){
  cesta.clearCesta()
  mensaje.value = 'Cesta vaciada'
  clearTimeout(mensajeTimer)
  mensajeTimer = setTimeout(() => mensaje.value = '', 2500)
}
function procederPago(){
  // placeholder: redirigir a página de checkout o login
  router.push('/')
}
</script>

<style scoped>
img { border-radius:6px; }
</style>
