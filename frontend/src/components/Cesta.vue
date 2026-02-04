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
  <PaymentModal v-if="showPayment" @close="onPagoCerrado" @financing="onPagoFinanciacion" @paid="onPagoRealizado" @require-client="() => { showBuyerModal = true; showPayment = false }" />
  <BuyerDataModal v-if="showBuyerModal" @close="() => showBuyerModal = false" @saved="onBuyerSaved" />
</template>

<script setup>
import { useCestaStore } from '@/store/cesta'
import { useRouter } from 'vue-router'
import { computed, ref } from 'vue'
import PaymentModal from './PaymentModal.vue'
import BuyerDataModal from './BuyerDataModal.vue'
import placeholderImg from '@/assets/404.jpg'

const cesta = useCestaStore()
const router = useRouter()

// usar computed para asegurar reactividad en la plantilla
const items = computed(() => cesta.items)
const totalItems = computed(() => cesta.totalItems)
const totalPrecio = computed(() => cesta.totalPrecio)

const mensaje = ref('')
let mensajeTimer = null
const showPayment = ref(false)
const showBuyerModal = ref(false)

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
  // mostrar modal de pago si hay artículos
  if (cesta.items.length === 0) {
    mensaje.value = 'No hay artículos en la cesta'
    clearTimeout(mensajeTimer)
    mensajeTimer = setTimeout(() => mensaje.value = '', 2500)
    return
  }
  // si ya tenemos datos del comprador en sessionStorage, abrir el modal de pago
  try{
    const stored = sessionStorage.getItem('cliente')
    if (stored) {
      showPayment.value = true
      return
    }
  }catch(e){
    // si falla el acceso a sessionStorage, caeremos al modal de captura igualmente
    console.warn('No se pudo leer cliente de sessionStorage', e)
  }
  // mostrar modal para pedir datos del comprador antes del pago
  showBuyerModal.value = true
}

function onPagoCerrado(){
  showPayment.value = false
}

function onPagoFinanciacion(){
  // preparar snapshot para la factura (Factua.vue lo leerá desde sessionStorage), vaciar la cesta y navegar
  showPayment.value = false
  try{
    // guardar snapshot de items para que Factura pueda renderizar incluso después de vaciar la cesta
    sessionStorage.setItem('invoiceItems', JSON.stringify(cesta.items))
    // guardar información de pago mínima
    const paidInfo = { metodo: 'Financiación', referencia: Math.random().toString(36).slice(2,10) }
    sessionStorage.setItem('paidInfo', JSON.stringify(paidInfo))
    // asegurar que los datos del cliente estén presentes (Factura los leerá desde sessionStorage)
    // (si no existen, el flujo de Factura mostrará campos vacíos)
  }catch(e){
    console.warn('No se pudo preparar snapshot para financiación', e)
  }
  // vaciar la cesta localmente ahora que hemos guardado un snapshot
  cesta.clearCesta()
  router.push('/factura')
}

function onBuyerSaved(cliente){
  // cerrar modal de buyer y abrir modal de pago
  showBuyerModal.value = false
  showPayment.value = true
  try{
    // guardar un snapshot de la cesta en el momento en que el comprador introduce sus datos
    // así Factura.vue podrá usarlo aunque la cesta se vacíe después
    sessionStorage.setItem('invoiceItems', JSON.stringify(cesta.items))
  }catch(e){
    console.warn('No se pudo guardar snapshot de invoiceItems al guardar buyer', e)
  }
}

function onPagoRealizado(payload){
  // payload contiene { metodo, referencia }
  showPayment.value = false
  try{
    // guardar snapshot de la cesta y la info de pago para que Factura.vue pueda mostrarla
    sessionStorage.setItem('invoiceItems', JSON.stringify(cesta.items))
    sessionStorage.setItem('paidInfo', JSON.stringify(payload))
  }catch(e){
    console.warn('No se pudo guardar snapshot de pago en sessionStorage', e)
  }

  cesta.clearCesta()
  mensaje.value = `Pago realizado (${payload.metodo}). Ref: ${payload.referencia}`
  clearTimeout(mensajeTimer)
  mensajeTimer = setTimeout(() => mensaje.value = '', 4000)

  // navegar a la factura para permitir descarga / visualización
  try{
    router.push('/factura')
  }catch(e){
    console.warn('No se pudo navegar a /factura tras el pago', e)
  }
}
</script>

<style scoped>
img { border-radius:6px; }
</style>


