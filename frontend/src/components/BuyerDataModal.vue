<template>
  <div class="modal-backdrop" @click.self="close">
    <div class="modal-card">
      <h4>Datos del comprador</h4>

      <div class="mt-2">
        <label>Nombre completo *</label>
        <input v-model="cliente.nombre" placeholder="Nombre y apellidos" />

        <label>DNI/NIF *</label>
        <input v-model="cliente.nif" placeholder="12345678A" />

        <label>Email</label>
        <input v-model="cliente.email" placeholder="correo@ejemplo.com" />

        <label>Teléfono</label>
        <input v-model="cliente.telefono" placeholder="600 000 000" />

        <label>Dirección</label>
        <input v-model="cliente.direccion" placeholder="Calle, nº, ciudad" />

        <div class="mt-3 d-flex justify-content-end gap-2">
          <button class="btn btn-secondary" @click="close">Cancelar</button>
          <button class="btn btn-primary" @click="guardar">Guardar y continuar</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive } from 'vue'
const emit = defineEmits(['close','saved'])

const cliente = reactive({ nombre:'', nif:'', email:'', telefono:'', direccion:'' })

function guardar(){
  // validación mínima: nombre y nif obligatorios
  if (!cliente.nombre || !cliente.nif){
    alert('Por favor introduce el nombre y el DNI/NIF del comprador.')
    return
  }
  // guardar en sessionStorage para que Factura.vue lo lea
  try{
    sessionStorage.setItem('cliente', JSON.stringify(cliente))
  }catch(e){
    console.warn('No se pudo guardar cliente en sessionStorage', e)
  }
  emit('saved', { ...cliente })
}

function close(){ emit('close') }
</script>

<style scoped>
.modal-backdrop{ position:fixed; inset:0; background:rgba(0,0,0,0.45); display:flex; align-items:center; justify-content:center; z-index:2000 }
.modal-card{ background:white; padding:18px; border-radius:8px; width:520px; max-width:96% }
input{ width:100%; padding:8px; margin:6px 0 10px }
.d-flex{ display:flex }
.gap-2{ gap:8px }
</style>
