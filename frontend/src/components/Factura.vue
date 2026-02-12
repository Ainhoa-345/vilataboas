<template>
  <div class="container mt-4">
    <h3>Factura</h3>
  <div v-if="invoiceItems.length === 0" class="alert alert-info">No hay artículos en la factura.</div>

    <div v-else>
      <div v-if="loading" class="text-center my-4">
        <div class="spinner-border" role="status"><span class="visually-hidden">Cargando...</span></div>
        <div class="mt-2">Recuperando datos del vehículo...</div>
      </div>
      <div v-else>
      <!-- area que se transforma a PDF -->
      <div ref="invoiceRef" class="invoice-sheet">
        <div class="invoice-header">
          <div class="logo-wrap">
            <img src="/src/assets/logoEmpresaTeis.svg" alt="logo" class="logo" />
          </div>
          <div class="company">
            <h2>EmpresaTeis</h2>
            <div class="muted">Venta de Vehículos de Ocasión</div>
            <div class="muted small">Vigo, Pontevedra | ☎ +34 986 123 456 | ✉ info@empresateis.com</div>
          </div>
        </div>

        <h4 class="text-center invoice-title">FACTURA Nº {{ facturaId }}</h4>

        <div class="invoice-meta">
          <div class="billing">
            <h5>Datos de Facturación</h5>
            <div><strong>Cliente:</strong> {{ cliente.nombre || '---' }}</div>
            <div><strong>DNI/NIF:</strong> {{ cliente.nif || '---' }}</div>
            <div><strong>Email:</strong> {{ cliente.email || '---' }}</div>
            <div><strong>Teléfono:</strong> {{ cliente.telefono || '---' }}</div>
            <div><strong>Dirección:</strong> {{ cliente.direccion || '---' }}</div>
          </div>
          <div class="info">
            <h5>Información de la Factura</h5>
            <div><strong>Fecha:</strong> {{ fecha }}</div>
            <div><strong>Método de Pago:</strong> {{ metodoPagoPresent }}</div>
            <div><strong>Estado:</strong> <span class="text-success">PAGADO</span></div>
          </div>
        </div>

        <table class="invoice-table">
          <thead>
            <tr>
              <th>Vehículo</th>
              <th>Matrícula</th>
              <th>Año</th>
              <th>Kms</th>
              <th>Cant.</th>
              <th>Precio Unit.</th>
              <th>Subtotal</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="it in invoiceItems" :key="it.id">
              <td>{{ it.nombre }}</td>
              <td>{{ it.matricula || '-' }}</td>
              <td>{{ it.anio || it.ano || '-' }}</td>
              <td>{{ it.kms || it.kilometros || '-' }}</td>
              <td>{{ it.cantidad }}</td>
              <td>{{ formatPrecio(it.precio) }}</td>
              <td>{{ formatPrecio((it.precio * it.cantidad)) }}</td>
            </tr>
          </tbody>
        </table>

        <div class="invoice-totals">
          <div class="tot-row"><span>Subtotal:</span><strong>{{ formatPrecio(subtotal) }}</strong></div>
          <div class="tot-row"><span>IVA (21%):</span><strong>{{ formatPrecio(iva) }}</strong></div>
         <div class="tot-row total"><span>TOTAL:</span><strong>{{ formatPrecio(total) }}</strong></div>
        </div>

        <div class="invoice-footer">¡Gracias por su compra! Esta factura ha sido generada electrónicamente y es válida sin firma.</div>
      </div>

      <div class="d-flex gap-2 mt-3">
        <button class="btn btn-primary" @click="generarPDF">Descargar factura (PDF)</button>
        <button class="btn btn-secondary" @click="volver">Volver a la tienda</button>
      </div>
      <div v-if="saveStatus" class="mt-2">
        <div :class="['alert', (saveStatus === 'Guardada' || saveStatus === 'GuardadaLocal') ? 'alert-success' : 'alert-info']" role="alert">{{ saveMessage }}</div>
      </div>
      </div>
  </div>
  </div>
</template>

<script setup>
import { computed, ref, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useCestaStore } from '@/store/cesta'
import { jsPDF } from 'jspdf'
import html2canvas from 'html2canvas'
import { getArticuloById } from '@/api/articulos'
import { getClienteLogueado } from '@/api/clientes'

const router = useRouter()
const cesta = useCestaStore()

const items = computed(()=>cesta.items)
const totalPrecio = computed(()=>cesta.totalPrecio)

// almacenar fecha ISO sin procesar para envíos, y presentar fecha formateada europea al usuario
const fechaRaw = new Date().toISOString()
const fecha = (function(){
  try{
    return new Date(fechaRaw).toLocaleString('es-ES', { day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit', second:'2-digit', hour12:false })
  }catch(e){
    return new Date().toLocaleString()
  }
})()
const facturaId = 'FAC-' + Date.now().toString(16)
const cliente = ref({ nombre: '', nif:'', email:'', telefono:'', direccion:'' })
// vacío por defecto; se establecerá desde sessionStorage (paidInfo) o sesión de Stripe si está presente
const metodoPago = ref('')

// Mapeo para presentación en la interfaz (etiquetas amigables en español)
const metodoPagoPresent = computed(() => {
  try{
    const raw = (metodoPago.value || '').toString().toLowerCase()
    if (!raw){
      // respaldo: intentar sessionStorage paidInfo
      try{
        const paidRaw = sessionStorage.getItem('paidInfo')
        if (paidRaw){
          const p = JSON.parse(paidRaw)
          if (p && p.metodo) return humanizeMetodo((p.metodo||'').toString().toLowerCase())
        }
      }catch(e){ /* ignore */ }
      return '---'
    }
    return humanizeMetodo(raw)
  }catch(e){ return metodoPago.value || '---' }
})

function humanizeMetodo(val){
  if (!val) return '---'
  if (val.includes('tarjeta') || val.includes('card') || val.includes('stripe')) return 'Tarjeta'
  if (val.includes('transfer') || val.includes('transferencia') ) return 'Transferencia bancaria'
  if (val.includes('financi')) return 'Financiación'
  if (val.includes('paypal') || val.includes('pay')) return 'PayPal'
  if (val.includes('efectivo')) return 'Efectivo'
  // por defecto: capitalizar primera letra
  return val.charAt(0).toUpperCase() + val.slice(1)
}

const invoiceRef = ref(null)

// estado de guardado
const saveStatus = ref('') // '' | 'Guardada' | 'Error' | 'Guardando'
const saveMessage = ref('')
const savedKey = `facturaSaved_${facturaId}`

// copia local de items para enriquecer con datos del backend si falta info del vehículo
const invoiceItems = ref([])

// total (precio mostrado en los items) — se asume que incluye IVA
const total = computed(()=>{
  return invoiceItems.value.reduce((s,it)=> s + (it.precio * (it.cantidad || 1)), 0)
})

// Si el precio de venta incluye IVA, extraemos la base imponible (subtotal sin IVA)
// subtotal = total / 1.21, iva = total - subtotal
const subtotal = computed(()=> Math.round((total.value / 1.21) * 100) / 100)
const iva = computed(()=> Math.round((total.value - subtotal.value) * 100) / 100)

onMounted(async ()=>{
  // intentar cargar cliente desde sessionStorage (guardado por BuyerDataModal)
  try{
    const raw = sessionStorage.getItem('cliente')
    if (raw){
      const parsed = JSON.parse(raw)
      cliente.value = { ...cliente.value, ...parsed }
    }
  }catch(e){
    console.warn('No se pudieron cargar datos de cliente desde sessionStorage', e)
  }

  // si no hay cliente en sessionStorage, intentar obtenerlo desde el backend (cliente logueado)
  if (!cliente.value || !cliente.value.nombre){
    try{
      const logged = await getClienteLogueado()
      if (logged){
        cliente.value.nombre = `${logged.nombre || ''} ${logged.apellidos || ''}`.trim()
        cliente.value.nif = logged.dni || ''
        cliente.value.email = logged.email || ''
        cliente.value.telefono = logged.movil || ''
        cliente.value.direccion = logged.direccion || ''
      }
    }catch(e){
      // no hay token o backend no disponible; seguir sin bloquear
      // console.warn('No se pudo obtener cliente logueado', e)
    }
  }

  // Priorizar snapshot guardado en sessionStorage (guardado en Cesta antes de vaciarla)
  try{
    const snap = sessionStorage.getItem('invoiceItems')
    if (snap){
      invoiceItems.value = JSON.parse(snap) || []
      // limpiar snapshot para evitar reutilizarlo accidentalmente
      // (no lo eliminamos todavía para permitir re-descarga si hace falta)
    } else {
      // hidratar desde el store si no hay snapshot
      await ensureHydration()
      invoiceItems.value = cesta.items.map(it => ({ ...it }))
    }
  }catch(e){
    console.warn('Error leyendo invoiceItems desde sessionStorage', e)
    await ensureHydration()
    invoiceItems.value = cesta.items.map(it => ({ ...it }))
  }

  // si hay información de pago guardada, usarla
  try{
    // Primero: comprobar si Stripe redirigió de vuelta con session_id en la URL
    try{
      const params = new URLSearchParams(window.location.search)
      const sid = params.get('session_id') || params.get('sessionId')
      if (sid){
        // pedir al backend detalles de la sesión (paymentsRoutes resolverá a metodo: 'tarjeta')
        try{
          // Función auxiliar para intentar fetch y devolver JSON parseado si es exitoso
          async function tryFetch(url){
            try{
              const r = await fetch(url)
              if (r && r.ok) return await r.json()
            }catch(e){ /* ignorar */ }
            return null
          }

          // Probar una serie de endpoints en orden de probabilidad de funcionar en dev y prod
          const tried = []
          // 1) parámetro query relativo (funciona cuando Vite hace proxy /api -> backend)
          tried.push(`/api/payments/session?session_id=${encodeURIComponent(sid)}`)
          // 2) parámetro de ruta relativo (algunas configuraciones eliminan query strings)
          tried.push(`/api/payments/session/${encodeURIComponent(sid)}`)
          // 3) origen directo del backend (en caso de que el proxy de dev no esté activo)
          const backend = (window.__BACKEND_ORIGIN__ || 'http://localhost:5000')
          tried.push(`${backend}/api/payments/session?session_id=${encodeURIComponent(sid)}`)
          tried.push(`${backend}/api/payments/session/${encodeURIComponent(sid)}`)

          let info = null
          for (const url of tried){
            info = await tryFetch(url)
            if (info) {
              // console.debug('Recuperada info de sesión stripe desde', url, info)
              break
            }
          }

          if (info && info.metodo){
            metodoPago.value = info.metodo
            try{ sessionStorage.setItem('paidInfo', JSON.stringify({ metodo: info.metodo, referencia: info.referencia })) }catch(e){}
          } else {
            console.warn('No se pudo recuperar info de sesión stripe desde los endpoints probados', tried)
          }
        }catch(e){ console.warn('No se pudo obtener info de sesión stripe', e) }
      }
    }catch(e){ console.warn('Error al parsear URL para session_id', e) }

    // Respaldo: si ya hay paidInfo en sessionStorage (transferencia/financiación/otro)
    const paidRaw = sessionStorage.getItem('paidInfo')
    if (paidRaw){
      const paid = JSON.parse(paidRaw)
      if (paid && paid.metodo) metodoPago.value = paid.metodo
      // limpiar para no repetir
      sessionStorage.removeItem('paidInfo')
    }
  }catch(e){
    console.warn('No se pudo procesar paidInfo', e)
  }

  // por si acaso, intentar recuperar datos concretos desde el backend para los items que sigan incompletos
  for (let i = 0; i < invoiceItems.value.length; i++){
    const it = invoiceItems.value[i]
    if ((!it.matricula || !it.anio || !it.kms) && it.id){
      try {
        const full = await getArticuloById(it.id)
        invoiceItems.value[i].matricula = invoiceItems.value[i].matricula || full.matricula || ''
        invoiceItems.value[i].anio = invoiceItems.value[i].anio || full.anio || full.ano || ''
        invoiceItems.value[i].kms = invoiceItems.value[i].kms || full.kilometros || full.kms || ''
        invoiceItems.value[i].precio = invoiceItems.value[i].precio || full.precio || 0
      } catch (err){
        console.warn('No se pudo obtener datos completos para el artículo', it.id, err.message || err)
      }
    }
  }
  // si hubo cambios locales, no es necesario guardar aquí porque ensureHydration ya lo hizo cuando corresponde
})

const loading = ref(false)

async function saveFactura(){
  try{
    saveStatus.value = 'Guardando'
    saveMessage.value = 'Guardando factura en el servidor...'
    const payload = {
      numeroFactura: facturaId,
      fecha: new Date().toISOString(),
      cliente: cliente.value,
      items: invoiceItems.value.map(it => {
        // normalizar id a string para evitar errores de cast (ObjectId -> { $oid: ... })
        const rawId = it.id || it._id || null
        let normId = null
        try{
          if (!rawId) normId = null
          else if (typeof rawId === 'string') {
            // si la cadena contiene un ObjectId embebido como "{ '$oid': '...' }" extraer el hex
            const m = rawId.match(/([a-fA-F0-9]{24})/)
            if (m) normId = m[1]
            else normId = rawId
          }
          else if (rawId.$oid) normId = rawId.$oid
          else if (rawId.toString) normId = rawId.toString()
        }catch(e){ normId = null }

        return {
          id: normId,
          matricula: it.matricula || null,
          marca: it.marca || it.marca || null,
          modelo: it.modelo || it.nombre || null,
          anio: it.anio || it.ano || null,
          kilometros: it.kms || it.kilometros || null,
          precio: Number(it.precio) || 0,
          cantidad: Number(it.cantidad) || 1
        }
      }),
      subtotal: subtotal.value,
      iva: iva.value,
      total: total.value,
      estadoPago: 'pagado',
      // normalizar metodoPago: backend acepta 'efectivo'|'tarjeta'|'transferencia'
      metodoPago: (function(){
        const allowed = ['efectivo','tarjeta','transferencia']
        const val = (metodoPago.value || '').toString().toLowerCase()
        if (allowed.includes(val)) return val
        // mapear términos comunes
        if (val.includes('financi')) return 'transferencia'
        if (val.includes('card') || val.includes('tarjeta')) return 'tarjeta'
        return 'efectivo'
      })()
    }

    const res = await fetch('/api/facturas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })

    if (!res.ok) {
      const err = await res.json().catch(()=>({ error: res.statusText }))
      saveStatus.value = 'Error'
      saveMessage.value = `No se pudo guardar la factura: ${err.error || res.statusText}`
      console.error('Save factura error', err)
      return
    }
    const saved = await res.json().catch(()=>null)
        // El backend ahora retorna { status, location, id?, transaccionId?, pendingFile?, pendingCount?, message?, forwardedStatus?, forwardedBody? }
    if (res.status === 201) {
      // puede ser guardado en db o en json-server
      if (saved && saved.location === 'db'){
        saveStatus.value = 'Guardada'
        saveMessage.value = `Factura guardada en la base de datos (id: ${saved.id || (saved.factura && saved.factura._id) || ''})`
      } else if (saved && saved.location === 'json-server'){
        saveStatus.value = 'Guardada'
        saveMessage.value = `Factura reenviada a json-server (transaccion: ${saved.transaccionId || ''})`
      } else {
        saveStatus.value = 'Guardada'
        saveMessage.value = saved?.message || 'Factura procesada.'
      }
    } else if (res.status === 202) {
      saveStatus.value = 'GuardadaLocal'
      const file = saved?.pendingFile || 'backend/data/pending_facturas.json'
      const count = saved?.pendingCount || undefined
      saveMessage.value = `Factura guardada localmente en: ${file}` + (count ? ` (pendientes: ${count})` : '')
    } else {
      saveStatus.value = 'Guardada'
      saveMessage.value = saved?.message || 'Factura procesada.'
    }
    // marcar en sessionStorage para evitar reenvíos desde la misma sesión
    try{ sessionStorage.setItem(savedKey, '1') }catch(e){ /* ignorar */ }
    console.log('Factura guardada', saved)
  }catch(e){
    saveStatus.value = 'Error'
    saveMessage.value = 'Error guardando la factura: ' + (e.message || e)
    console.error('saveFactura exception', e)
  }
}

// Observador: guardar la factura automáticamente cuando invoiceItems esté listo
watch(invoiceItems, async (newVal) => {
  try{
    if (Array.isArray(newVal) && newVal.length > 0 && !sessionStorage.getItem(savedKey) && saveStatus.value !== 'Guardando' && saveStatus.value !== 'Guardada'){
      await saveFactura()
    }
  }catch(e){
    console.warn('Watcher saveFactura error', e)
  }
}, { immediate: true, deep: true })

// si se accede a la factura y los items no están completos, intentar hidratar y guardar en el store
async function ensureHydration(){
  try{
    // llamar a la acción del store para persistir campos faltantes
    loading.value = true
    await cesta.hydrateItems()
    // actualizar la vista local con la versión posiblemente enriquecida
    invoiceItems.value = cesta.items.map(it => ({ ...it }))
  }catch(e){
    console.warn('Error al hidratar items en factura', e)
  }finally{
    loading.value = false
  }
}

function formatPrecio(v){
  return Number(v).toLocaleString('es-ES', { style:'currency', currency:'EUR' })
}

async function generarPDF(){
  if (!invoiceRef.value) return
  const el = invoiceRef.value
// usar html2canvas para renderizar el DOM como imagen
  const canvas = await html2canvas(el, { scale: 2, useCORS: true })
  const imgData = canvas.toDataURL('image/png')
  const pdf = new jsPDF('p', 'mm', 'a4')
  const imgProps = pdf.getImageProperties(imgData)
  const pdfWidth = pdf.internal.pageSize.getWidth()
  const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width
  pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight)
  pdf.save(`${facturaId}.pdf`)
}

function volver(){
  cesta.clearCesta()
  router.push('/')
}
</script>

<style scoped>
.invoice-sheet{ background:#fff; padding:22px; border:1px solid #e6e6e6; border-radius:6px; color:#222; }
.invoice-header{ display:flex; gap:10px; align-items:center; }
.logo{ width:86px; }
.company h2{ margin:0; color:#d14b4b }
.muted{ color:#666 }
.invoice-title{ color:#1a73e8; margin-top:12px; margin-bottom:12px }
.invoice-meta{ display:flex; justify-content:space-between; gap:20px; margin-bottom:14px }
.billing, .info{ width:48%; }
.invoice-table{ width:100%; border-collapse:collapse; margin-top:10px }
.invoice-table th, .invoice-table td{ border:1px solid #e8e8e8; padding:8px; text-align:left }
.invoice-totals{ margin-top:14px; width:100%; display:flex; flex-direction:column; gap:6px; align-items:flex-end }
.tot-row{ width:320px; display:flex; justify-content:space-between; }
.tot-row.total{ font-size:1.1em; font-weight:700 }
.invoice-footer{ margin-top:18px; color:#666; font-size:0.9em; }
</style>