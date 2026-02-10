<template>
  <div class="modal-backdrop" @click.self="close">
    <div class="modal-card">
      <h4>Elegir método de pago</h4>

      <div class="options">
        <button class="option-btn" @click="seleccionar('tarjeta')">Pago con tarjeta</button>
        <button class="option-btn" @click="seleccionar('transferencia')">Transferencia bancaria</button>
        <button class="option-btn" @click="seleccionar('financiacion')">Financiación</button>
      </div>

          <div v-if="metodo === 'tarjeta'" class="mt-3">
            <p>Se abrirá Stripe Checkout para procesar el pago seguro con tarjeta.</p>
            <div class="mt-2">
              <button class="btn btn-primary" @click="confirmarTarjeta">Pagar con tarjeta (Stripe Checkout) — {{ formatoImporte }}</button>
              <button class="btn btn-link" @click="resetear">Volver</button>
            </div>
          </div>

      <div v-if="metodo === 'transferencia'" class="mt-3">
        <p>Por favor realiza una transferencia a:</p>
        <ul>
          <li>Banco: Banco Ejemplo</li>
          <li>IBAN: ES00 0000 0000 0000 0000</li>
          <li>Concepto: Compra {{ referencia }}</li>
        </ul>
        <div class="mt-2">
          <button class="btn btn-primary" @click="confirmarTransferencia">He realizado la transferencia</button>
          <button class="btn btn-link" @click="resetear">Volver</button>
        </div>
      </div>

      <div class="mt-3 text-end">
        <button class="btn btn-secondary" @click="close">Cerrar</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useCestaStore } from '@/store/cesta'
import { getClienteLogueado } from '@/api/clientes'

const emit = defineEmits(['close','financing','paid','require-client'])
const cesta = useCestaStore()

const metodo = ref('')
const tarjeta = ref({ numero:'', exp:'', cvc:'' })
const referencia = generateRef()
const clienteData = ref(null)
const cargandoCliente = ref(true)

function generateRef(){
  return Math.random().toString(36).substring(2,10) + '-' + Date.now().toString().slice(-4)
}

const formatoImporte = computed(()=>`${cesta.totalPrecio} €`)

// Cargar datos del cliente desde el backend (db.json) al montar el componente
onMounted(async () => {
  cargandoCliente.value = true
  
  // Primero intentar obtener los datos del cliente logueado desde el backend
  try {
    const logged = await getClienteLogueado()
    if (logged && (logged.nombre || logged.dni)) {
      clienteData.value = {
        nombre: `${logged.nombre || ''} ${logged.apellidos || ''}`.trim(),
        nif: logged.dni || '',
        email: logged.email || '',
        telefono: logged.movil || '',
        direccion: logged.direccion || ''
      }
      // Guardar también en sessionStorage para compatibilidad con otros componentes
      sessionStorage.setItem('cliente', JSON.stringify(clienteData.value))
    }
  } catch (e) {
    console.warn('No se pudo obtener cliente logueado desde el backend', e)
  }

  // Si no hay cliente del backend, intentar leer de sessionStorage como fallback
  if (!clienteData.value) {
    try {
      const raw = sessionStorage.getItem('cliente')
      if (raw) {
        clienteData.value = JSON.parse(raw)
      }
    } catch (e) {
      console.warn('No se pudo leer cliente desde sessionStorage', e)
    }
  }

  cargandoCliente.value = false
})

// Función auxiliar para verificar si hay datos del cliente disponibles
async function verificarCliente() {
  // Si ya tenemos datos del cliente cargados, retornar true
  if (clienteData.value && (clienteData.value.nombre || clienteData.value.nif)) {
    return true
  }
  
  // Intentar cargar desde el backend una vez más
  try {
    const logged = await getClienteLogueado()
    if (logged && (logged.nombre || logged.dni)) {
      clienteData.value = {
        nombre: `${logged.nombre || ''} ${logged.apellidos || ''}`.trim(),
        nif: logged.dni || '',
        email: logged.email || '',
        telefono: logged.movil || '',
        direccion: logged.direccion || ''
      }
      sessionStorage.setItem('cliente', JSON.stringify(clienteData.value))
      return true
    }
  } catch (e) {
    console.warn('No se pudo verificar cliente desde el backend', e)
  }

  return false
}

async function seleccionar(m){
  // Antes de permitir elegir cualquier método, asegurarnos de que existen los datos del cliente
  const tieneCliente = await verificarCliente()
  if (!tieneCliente) {
    emit('require-client')
    return
  }

  if (m === 'financiacion'){
    // financiar: llevar a la sección de factura
    emit('financing')
    return
  }
  metodo.value = m
}

async function confirmarTarjeta(){
  // Antes de crear la sesión, asegurarnos que hay datos del cliente
  const tieneCliente = await verificarCliente()
  if (!tieneCliente) {
    emit('require-client')
    return
  }

  try{
    // Llamar al backend para crear Checkout Session
    const resp = await fetch('/api/payments/create-checkout-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: cesta.totalPrecio, description: 'Compra Vilataboas' })
    })

    if (!resp.ok) {
      const err = await resp.json().catch(()=>({ error: 'error' }))
      alert('No se pudo iniciar el pago: ' + (err.error || 'error del servidor'))
      return
    }

    const data = await resp.json()
    if (data && data.url) {
      // Redirigir al Checkout de Stripe
      window.location.href = data.url
      return
    }

    alert('No se obtuvo la URL de pago de Stripe.')
  } catch (e) {
    console.error('confirmarTarjeta error', e)
    alert('Error al procesar el pago. Inténtelo de nuevo más tarde.')
  }
}

async function confirmarTransferencia(){
  // comprobar que existen datos del cliente
  const tieneCliente = await verificarCliente()
  if (!tieneCliente) {
    emit('require-client')
    return
  }

  alert('Gracias. Cuando confirmemos la transferencia se procesará el pedido.')
  emit('paid', { metodo: 'transferencia', referencia })
  emit('close')
}

function resetear(){ metodo.value = '' }
function close(){ emit('close') }
</script>

<style scoped>
.modal-backdrop{
  position:fixed; inset:0; background:rgba(0,0,0,0.45); display:flex; align-items:center; justify-content:center; z-index:2000;
}
.modal-card{ background:white; padding:18px; border-radius:8px; width:420px; max-width:90%; }
.options{ display:flex; gap:8px; justify-content:space-between; }
.option-btn{ flex:1; padding:8px 10px; border-radius:6px; border:1px solid #ddd; background:#f8f9fa; cursor:pointer }
input{ width:100%; padding:6px; margin:6px 0 10px; }
</style>
