<template>
  <div class="container mt-4">
    <!-- ============================================== -->
    <!-- CABECERA                                       -->
    <!-- ============================================== -->
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h3>
        <i class="bi bi-bookmark-star me-2"></i>
        Gestión de Reservas
      </h3>
      <button class="btn btn-outline-primary" @click="recargarReservas">
        <i class="bi bi-arrow-clockwise me-1"></i> Recargar
      </button>
    </div>

    <!-- ============================================== -->
    <!-- MENSAJE SI NO HAY RESERVAS                    -->
    <!-- ============================================== -->
    <div v-if="vehiculosReservados.length === 0" class="alert alert-info">
      <i class="bi bi-info-circle me-2"></i>
      No hay vehículos reservados actualmente.
    </div>

    <!-- ============================================== -->
    <!-- TABLA DE RESERVAS                             -->
    <!-- ============================================== -->
    <!-- 
      Esta tabla muestra todas las reservas activas.
      - El admin puede ver los datos de la reserva
      - El admin puede cancelar cualquier reserva
    -->
    <div v-else class="table-responsive">
      <table class="table table-striped table-hover">
        <thead class="table-dark">
          <tr>
            <th>Vehículo</th>
            <th>Precio</th>
            <th>Cliente</th>
            <th>DNI</th>
            <th>Teléfono</th>
            <th>Email</th>
            <th>Fecha Reserva</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="vehiculo in vehiculosReservados" :key="vehiculo._id || vehiculo.id">
            <!-- Vehículo -->
            <td>
              <div class="d-flex align-items-center">
                <img 
                  :src="urlImagen(vehiculo.imagen)" 
                  alt="Vehículo" 
                  class="me-2 rounded"
                  style="width: 50px; height: 40px; object-fit: cover;"
                />
                <div>
                  <strong>{{ vehiculo.marca }} {{ vehiculo.modelo }}</strong>
                  <br>
                  <small class="text-muted">{{ vehiculo.anio }} - {{ vehiculo.kilometros }} km</small>
                </div>
              </div>
            </td>
            
            <!-- Precio -->
            <td>
              <span class="badge bg-success fs-6">{{ vehiculo.precio }}€</span>
            </td>
            
            <!-- Cliente -->
            <td>{{ vehiculo.reserva?.nombre || '-' }}</td>
            
            <!-- DNI -->
            <td>
              <code>{{ vehiculo.reserva?.dni || '-' }}</code>
            </td>
            
            <!-- Teléfono -->
            <td>{{ vehiculo.reserva?.telefono || '-' }}</td>
            
            <!-- Email -->
            <td>{{ vehiculo.reserva?.email || '-' }}</td>
            
            <!-- Fecha Reserva -->
            <td>
              <small>{{ formatearFecha(vehiculo.reserva?.fecha) }}</small>
            </td>
            
            <!-- Acciones -->
            <td>
              <button 
                class="btn btn-sm btn-danger" 
                @click="cancelarReserva(vehiculo)"
                title="Cancelar reserva"
              >
                <i class="bi bi-x-circle me-1"></i> Cancelar
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- ============================================== -->
    <!-- RESUMEN DE RESERVAS                           -->
    <!-- ============================================== -->
    <div v-if="vehiculosReservados.length > 0" class="card mt-4">
      <div class="card-body">
        <div class="row text-center">
          <div class="col-md-4">
            <h5 class="text-primary">{{ vehiculosReservados.length }}</h5>
            <small class="text-muted">Vehículos Reservados</small>
          </div>
          <div class="col-md-4">
            <h5 class="text-success">{{ totalValorReservado }}€</h5>
            <small class="text-muted">Valor Total Reservado</small>
          </div>
          <div class="col-md-4">
            <h5 class="text-info">{{ clientesUnicos }}</h5>
            <small class="text-muted">Clientes Distintos</small>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { getArticulos, updateArticulo } from '@/api/articulos.js';
import Swal from 'sweetalert2';
import placeholderImg from '@/assets/404.jpg';

// ============================================== 
// VARIABLES
// ============================================== 
const vehiculos = ref([]);

// ============================================== 
// COMPUTED
// ============================================== 
/**
 * vehiculosReservados: Filtra solo los vehículos que tienen reserva activa
 */
const vehiculosReservados = computed(() => {
  return vehiculos.value.filter(v => v.reserva && v.reserva.dni);
});

/**
 * totalValorReservado: Suma el precio de todos los vehículos reservados
 */
const totalValorReservado = computed(() => {
  return vehiculosReservados.value.reduce((total, v) => total + (v.precio || 0), 0);
});

/**
 * clientesUnicos: Cuenta los clientes distintos con reservas
 */
const clientesUnicos = computed(() => {
  const dnis = new Set(vehiculosReservados.value.map(v => v.reserva?.dni).filter(Boolean));
  return dnis.size;
});

// ============================================== 
// FUNCIONES
// ============================================== 

/**
 * Carga inicial de vehículos
 */
onMounted(async () => {
  await recargarReservas();
});

/**
 * recargarReservas: Recarga la lista de vehículos desde el servidor
 */
const recargarReservas = async () => {
  try {
    vehiculos.value = await getArticulos();
  } catch (error) {
    console.error('Error cargando vehículos:', error);
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: 'No se pudieron cargar los vehículos.'
    });
  }
};

/**
 * urlImagen: Resuelve la URL de la imagen del vehículo
 */
const urlImagen = (ruta) => {
  if (!ruta) return placeholderImg;
  if (ruta.startsWith('http://') || ruta.startsWith('https://')) return ruta;
  if (ruta.startsWith('/public/')) return ruta.replace(/^\/public/, '');
  if (ruta.startsWith('/uploads')) return `http://localhost:5000${ruta}`;
  if (ruta.startsWith('/')) return ruta;
  return placeholderImg;
};

/**
 * formatearFecha: Formatea una fecha ISO a formato legible
 */
const formatearFecha = (fecha) => {
  if (!fecha) return '-';
  try {
    return new Date(fecha).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (e) {
    return '-';
  }
};

/**
 * cancelarReserva: Cancela la reserva de un vehículo (ADMIN)
 * 
 * @param {Object} vehiculo - El vehículo del que cancelar la reserva
 */
const cancelarReserva = async (vehiculo) => {
  // Confirmar la acción
  const result = await Swal.fire({
    icon: 'warning',
    title: '¿Cancelar esta reserva?',
    html: `
      <p>¿Estás seguro de que quieres cancelar la reserva de:</p>
      <p><strong>${vehiculo.marca} ${vehiculo.modelo}</strong></p>
      <p>Cliente: <strong>${vehiculo.reserva?.nombre}</strong> (${vehiculo.reserva?.dni})</p>
    `,
    showCancelButton: true,
    confirmButtonText: 'Sí, cancelar reserva',
    cancelButtonText: 'No, mantener',
    confirmButtonColor: '#dc3545'
  });

  if (!result.isConfirmed) return;

  try {
    // IMPORTANTE: json-server usa el campo "id" simple, no el _id de MongoDB
    const vehiculoId = vehiculo.id || vehiculo._id;

    // Quitar la reserva del vehículo
    await updateArticulo(vehiculoId, {
      ...vehiculo,
      reserva: null,
      estado: 'disponible'
    });

    Swal.fire({
      icon: 'success',
      title: 'Reserva cancelada',
      text: `La reserva de ${vehiculo.reserva?.nombre} ha sido cancelada.`
    });

    // Recargar la lista
    await recargarReservas();

  } catch (error) {
    console.error('Error al cancelar reserva:', error);
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: 'No se pudo cancelar la reserva. Inténtalo de nuevo.'
    });
  }
};
</script>

<style scoped>
/* ============================================== */
/* ESTILOS PARA GESTIÓN DE RESERVAS              */
/* ============================================== */

.table th {
  white-space: nowrap;
}

.table td {
  vertical-align: middle;
}

code {
  background-color: #e9ecef;
  padding: 2px 6px;
  border-radius: 4px;
  color: #0d6efd;
}
</style>
