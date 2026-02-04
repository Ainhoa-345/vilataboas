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
        <label>Nº tarjeta</label>
        <input v-model="tarjeta.numero" placeholder="4242 4242 4242 4242" />
        <label>Caducidad</label>
        <input v-model="tarjeta.exp" placeholder="MM/AA" />
        <label>CVC</label>
        <input v-model="tarjeta.cvc" placeholder="123" />
        <div class="mt-2">
          <button class="btn btn-primary" @click="confirmarTarjeta">Pagar {{ formatoImporte }}</button>
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
import { ref, computed } from 'vue'
import { useCestaStore } from '@/store/cesta'

const emit = defineEmits(['close','financing','paid','require-client'])
const cesta = useCestaStore()

const metodo = ref('')
const tarjeta = ref({ numero:'', exp:'', cvc:'' })
const referencia = generateRef()

function generateRef(){
  return Math.random().toString(36).substring(2,10) + '-' + Date.now().toString().slice(-4)
}

const formatoImporte = computed(()=>`${cesta.totalPrecio} €`)

function seleccionar(m){
  // Antes de permitir elegir cualquier método, asegurarnos de que existen los datos del cliente
  try{
    const raw = sessionStorage.getItem('cliente')
    if (!raw){
      // pedir datos al padre
      emit('require-client')
      return
    }
  }catch(e){
    console.warn('No se pudo acceder a sessionStorage para cliente', e)
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

function confirmarTarjeta(){
  // validación mínima (placeholder)
  // comprobar que existen datos del cliente
  try{
    const raw = sessionStorage.getItem('cliente')
    if (!raw){
      emit('require-client')
      return
    }
  }catch(e){
    console.warn('No se pudo leer cliente desde sessionStorage', e)
    emit('require-client')
    return
  }
  if (!tarjeta.value.numero) {
    alert('Introduce los datos de la tarjeta (demo).')
    return
  }
  // simular pago
  alert('Pago con tarjeta simulado. Gracias por su compra.')
  emit('paid', { metodo: 'tarjeta', referencia })
  emit('close')
}

function confirmarTransferencia(){
  // comprobar que existen datos del cliente
  try{
    const raw = sessionStorage.getItem('cliente')
    if (!raw){
      emit('require-client')
      return
    }
  }catch(e){
    console.warn('No se pudo leer cliente desde sessionStorage', e)
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
