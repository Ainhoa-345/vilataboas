<template>
  <div class="container mt-4">
    <h3>Factura</h3>
    <div v-if="items.length === 0" class="alert alert-info">No hay artículos en la cesta.</div>

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
            <div><strong>Método de Pago:</strong> {{ metodoPago }}</div>
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
          <div class="tot-row total"><span>TOTAL:</span><strong>{{ formatPrecio(totalPrecio) }}</strong></div>
        </div>

        <div class="invoice-footer">¡Gracias por su compra! Esta factura ha sido generada electrónicamente y es válida sin firma.</div>
      </div>

      <div class="d-flex gap-2 mt-3">
        <button class="btn btn-primary" @click="generarPDF">Descargar factura (PDF)</button>
        <button class="btn btn-secondary" @click="volver">Volver a la tienda</button>
      </div>
      </div>
  </div>
  </div>
</template>

<script setup>
import { computed, ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useCestaStore } from '@/store/cesta'
import { jsPDF } from 'jspdf'
import html2canvas from 'html2canvas'
import { getArticuloById } from '@/api/articulos'

const router = useRouter()
const cesta = useCestaStore()

const items = computed(()=>cesta.items)
const totalPrecio = computed(()=>cesta.totalPrecio)

const fecha = new Date().toLocaleString()
const facturaId = 'FAC-' + Date.now().toString(16)
const cliente = ref({ nombre: '', nif:'', email:'', telefono:'', direccion:'' })
const metodoPago = ref('Financiación')

const invoiceRef = ref(null)

// copia local de items para enriquecer con datos del backend si falta info del vehículo
const invoiceItems = ref([])

const subtotal = computed(()=>{
  return invoiceItems.value.reduce((s,it)=> s + (it.precio * (it.cantidad || 1)), 0)
})
const iva = computed(()=> Math.round(subtotal.value * 0.21 * 100) / 100)

onMounted(async ()=>{
  // primero intentar hidratar/persistir desde el store (esto actualizará localStorage si había datos faltantes)
  await ensureHydration()

  // ahora inicializar invoiceItems desde la versión del store (ya enriquecida si fue posible)
  invoiceItems.value = cesta.items.map(it => ({ ...it }))

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
