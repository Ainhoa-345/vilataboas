<template>
  <div class="p-3 bg-light border">

    <h3 class="text-center mb-4">Gestión de Citas — Taller</h3>

    <!-- FORMULARIO -->
    <form @submit.prevent="guardar" class="mb-4">

      <div class="row mb-3">
        <!-- Matrícula -->
        <div class="col-md-4">
          <label>Matrícula</label>
          <input 
            type="text"
            class="form-control text-center"
            v-model="nuevaCita.matricula"
            @blur="validarMatricula"
            :class="{ 'is-invalid': !matriculaValida }"
            required
          />
        </div>

        <!-- Móvil -->
        <div class="col-md-4">
          <label>Móvil</label>
          <input 
            type="tel"
            class="form-control text-center"
            v-model="nuevaCita.movilCliente"
            @blur="validarMovil"
            :class="{ 'is-invalid': !movilValido }"
            required
          />
        </div>

        <!-- Fecha -->
        <div class="col-md-4">
          <label>Fecha</label>
          <input 
            type="date"
            class="form-control"
            v-model="nuevaCita.fechaCita"
            @blur="validarFecha"
            :class="{ 'is-invalid': !fechaValida }"
            required
          />
        </div>
      </div>

      <!-- SERVICIO (DESPLEGABLE) -->
      <div class="mb-3">
        <label class="me-3">Servicio</label>
        <select class="form-select" v-model="nuevaCita.servicioTaller" required>
          <option disabled value="">Seleccione un servicio</option>
          <option value="revision">Revisión</option>
          <option value="preITV">Pre ITV</option>
          <option value="neumaticos">Neumáticos</option>
          <option value="frenos">Frenos</option>
          <option value="cambioAceite">Cambio de Aceite</option>
        </select>
      </div>

      <!-- ESTADO (RADIO BUTTONS) -->
      <div class="mb-3">
        <label class="me-3">Estado</label>
        <label class="me-2">
          <input type="radio" value="pendiente" v-model="nuevaCita.estadoCita" /> Pendiente
        </label>
        <label>
          <input type="radio" value="finalizado" v-model="nuevaCita.estadoCita" /> Finalizado
        </label>
      </div>

      <!-- Acepta -->
      <div class="mb-3">
        <input type="checkbox" v-model="nuevaCita.acepta" required />
        <label class="ms-2">Aceptar presupuesto</label>
      </div>

      <!-- Botón -->
      <button class="btn btn-primary w-100 mb-3">
        {{ nuevaCita.id ? "Modificar Cita" : "Guardar Cita" }}
      </button>

      <!-- Recargar -->
      <button @click.prevent="cargarCitas" class="btn btn-secondary w-100">
        Recargar Página
      </button>
    </form>

    <!-- TABLA -->
    <table class="table table-bordered table-striped">
      <thead class="table-primary">
        <tr>
          <th>ID</th>
          <th>Matrícula</th>
          <th>Móvil</th>
          <th>Fecha</th>
          <th>Servicio</th>
          <th>Estado</th>
          <th>Acciones</th>
        </tr>
      </thead>

      <tbody>
        <tr v-for="cita in citas" :key="cita.id">
          <td>{{ cita.id }}</td>
          <td>{{ cita.matricula }}</td>
          <td>{{ cita.movilCliente }}</td>
          <td>{{ cita.fechaCita }}</td>
          <td>{{ cita.servicioTaller }}</td>
          <td>{{ cita.estadoCita }}</td>

          <td>
            <button 
              class="btn btn-warning btn-sm me-1"
              @click="editar(cita)"
            >
              <i class="bi bi-pencil"></i>
            </button>

            <button 
              class="btn btn-danger btn-sm"
              @click="eliminar(cita.id)"
            >
              <i class="bi bi-trash"></i>
            </button>
          </td>
        </tr>
      </tbody>
    </table>

  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import {
  nuevaCita,
  limpiarCita,
  obtenerCitas,
  guardarCita,
  eliminarCita,
  validarMatricula,
  validarMovil,
  validarFecha,
  matriculaValida,
  movilValido,
  fechaValida
} from "@/api/taller.js";

const citas = ref([]);

const cargarCitas = async () => {
  citas.value = await obtenerCitas();
};

onMounted(() => cargarCitas());

const guardar = async () => {
  const ok = await guardarCita();
  if (ok) {
    limpiarCita();
    cargarCitas();
  }
};

const editar = (cita) => {
  nuevaCita.value = { ...cita };
};

const eliminar = async (id) => {
  await eliminarCita(id);
  cargarCitas();
};
</script>
