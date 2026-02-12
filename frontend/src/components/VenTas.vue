<template>
    <div class="container-fluid mt-2">
        <div class="row g-4">
            <div 
            v-for="car in vehiculos"
            :key="car._id"
            class="col-12 col-md-6 col-lg-3"
            >
                <!-- ============================================== -->
                <!-- TARJETA DEL VEHÍCULO CON CONTROL DE STOCK     -->
                <!-- ============================================== -->
                <div 
                    class="card h-80 shadow-sm position-relative" 
                    :class="{ 
                        'agotado': estaAgotado(car),
                        'reservado': !estaAgotado(car) && estaReservado(car)
                    }"
                    @click="mostrarDetalles(car)" 
                    style="cursor: pointer;"
                >
                    <!-- ============================================== -->
                    <!-- OVERLAY DE AGOTADO (ROJO)                     -->
                    <!-- ============================================== -->
                    <div v-if="estaAgotado(car)" class="overlay-agotado">
                        <span class="texto-agotado">AGOTADO</span>
                    </div>
                    
                    <!-- ============================================== -->
                    <!-- OVERLAY DE RESERVADO (AZUL)                   -->
                    <!-- ============================================== -->
                    <!-- 
                        Se muestra cuando el vehículo tiene una reserva activa.
                        - Fondo azul semitransparente
                        - Texto "RESERVADO" en azul
                        - Solo se muestra si NO está agotado (prioridad a agotado)
                    -->
                    <div v-else-if="estaReservado(car)" class="overlay-reservado">
                        <span class="texto-reservado">RESERVADO</span>
                    </div>
                    <!-- ============================================== -->
                    
                    <img
                        :src="urlImagen(car.imagen)"
                        class="card-img-top"
                        alt="vehiculo"
                        style="height: 200px; object-fit: cover;"
                    ></img>

                    <div class="card-body">
                        <h5 class="card-title">{{ car.marca }} {{ car.modelo }}</h5>
                        <p class="card-text">
                            <strong>Año:</strong> {{ car.anio }}<br>
                            <strong>Km:</strong> {{ car.kilometros }}<br>
                            <strong>Precio:</strong> {{ car.precio }}€<br>
                            <strong>Stock:</strong> 
                            <span :class="car.stock > 0 ? 'text-success' : 'text-danger'">
                                {{ car.stock || 0 }} unidades
                            </span>
                        </p>   
                    </div>

                    <div class="card-footer text-end bg-white d-flex justify-content-between align-items-center">
                        <!-- ============================================== -->
                        <!-- BADGE DE DISPONIBILIDAD                       -->
                        <!-- ============================================== -->
                        <!-- 
                            Prioridad de estados:
                            1. AGOTADO (rojo) - si no hay stock
                            2. RESERVADO (azul) - si está reservado pero hay stock
                            3. DISPONIBLE (verde) - si hay stock y no está reservado
                        -->
                        <span 
                            v-if="estaAgotado(car)" 
                            class="badge bg-danger"
                        >
                            <i class="bi bi-x-circle me-1"></i>agotado
                        </span>
                        <span 
                            v-else-if="estaReservado(car)" 
                            class="badge bg-info"
                        >
                            <i class="bi bi-bookmark-check me-1"></i>reservado
                        </span>
                        <span 
                            v-else 
                            class="badge bg-success"
                        >
                            <i class="bi bi-check-circle me-1"></i>disponible
                        </span>
                        <!-- ============================================== -->
                        
                        <div>
                            <!-- ============================================== -->
                            <!-- BOTÓN RESERVAR COCHE                          -->
                            <!-- ============================================== -->
                            <!-- 
                                - Se muestra si hay stock y NO está reservado
                                - Abre modal para introducir datos de reserva
                            -->
                            <button
                                v-if="!estaAgotado(car) && !estaReservado(car)"
                                class="btn badge btn-sm btn-info ms-1"
                                @click.stop="abrirModalReserva(car)"
                            >
                                <i class="bi bi-bookmark me-1"></i> Reservar
                            </button>
                            <!-- Mostrar si ya está reservado por el usuario actual -->
                            <button
                                v-else-if="estaReservadoPorMi(car)"
                                class="btn badge btn-sm btn-warning ms-1"
                                @click.stop="cancelarMiReserva(car)"
                            >
                                <i class="bi bi-x-circle me-1"></i> Cancelar Reserva
                            </button>
                            <!-- ============================================== -->
                            
                            <!-- BOTÓN AÑADIR A CESTA -->
                            <button
                                class="btn badge btn-sm ms-1"
                                :class="estaAgotado(car) || estaReservado(car) ? 'btn-secondary' : 'btn-success'"
                                :disabled="estaAgotado(car) || estaReservado(car)"
                                @click.stop="agregarACesta(car)"
                            >
                                <template v-if="estaAgotado(car)">
                                    <i class="bi bi-x-circle me-1"></i> Sin stock
                                </template>
                                <template v-else-if="estaReservado(car)">
                                    <i class="bi bi-lock me-1"></i> Reservado
                                </template>
                                <template v-else>
                                    <i class="bi bi-cart3 me-1"></i> Cesta
                                </template>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Modal de detalles del vehículo -->
        <div v-if="vehiculoSeleccionado" class="modal fade show d-block" tabindex="-1" style="background-color: rgba(0,0,0,0.5);" @click.self="cerrarModal">
            <div class="modal-dialog modal-lg modal-dialog-centered">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">{{ vehiculoSeleccionado.marca }} {{ vehiculoSeleccionado.modelo }}</h5>
                        <button type="button" class="btn-close" @click="cerrarModal"></button>
                    </div>
                    <div class="modal-body">
                        <div class="row">
                            <div class="col-md-6">
                                <img
                                    :src="urlImagen(vehiculoSeleccionado.imagen)"
                                    class="img-fluid rounded"
                                    alt="vehiculo"
                                    style="max-height: 300px; width: 100%; object-fit: cover;"
                                >
                            </div>
                            <div class="col-md-6">
                                <h6 class="text-primary mb-3">Información General</h6>
                                <p><strong>Tipo:</strong> {{ vehiculoSeleccionado.tipo }}</p>
                                <p><strong>Matrícula:</strong> {{ vehiculoSeleccionado.matricula }}</p>
                                <p><strong>Marca:</strong> {{ vehiculoSeleccionado.marca }}</p>
                                <p><strong>Modelo:</strong> {{ vehiculoSeleccionado.modelo }}</p>
                                <p><strong>Año:</strong> {{ vehiculoSeleccionado.anio }}</p>
                                <p><strong>Estado:</strong> <span class="badge bg-primary">{{ vehiculoSeleccionado.estado }}</span></p>
                                <p><strong>Kilómetros:</strong> {{ vehiculoSeleccionado.kilometros }} km</p>
                                <p><strong>Precio:</strong> <span class="text-success fw-bold">{{ vehiculoSeleccionado.precio }}€</span></p>
                                <!-- ============================================== -->
                                <!-- MOSTRAR STOCK EN EL MODAL DE DETALLES         -->
                                <!-- ============================================== -->
                                <p>
                                    <strong>Stock:</strong> 
                                    <span 
                                        class="badge"
                                        :class="vehiculoSeleccionado.stock > 0 ? 'bg-success' : 'bg-danger'"
                                    >
                                        {{ vehiculoSeleccionado.stock || 0 }} unidades
                                    </span>
                                </p>
                                <!-- ============================================== -->
                            </div>
                        </div>
                        
                        <hr class="my-4">
                        
                        <div class="row">
                            <div class="col-md-6">
                                <h6 class="text-primary mb-3">Características Técnicas</h6>
                                <p><strong>Combustible:</strong> {{ vehiculoSeleccionado.combustible }}</p>
                                <p><strong>Transmisión:</strong> {{ vehiculoSeleccionado.transmision }}</p>
                                <p v-if="vehiculoSeleccionado.potencia_cv"><strong>Potencia:</strong> {{ vehiculoSeleccionado.potencia_cv }} CV</p>
                                <p v-if="vehiculoSeleccionado.descripcion"><strong>Descripción:</strong> {{ vehiculoSeleccionado.descripcion }}</p>
                            </div>
                            <div class="col-md-6">
                                <h6 class="text-primary mb-3">Ubicación</h6>
                                <p><strong>Provincia:</strong> {{ vehiculoSeleccionado.ubicacion.provincia }}</p>
                                <p><strong>Ciudad:</strong> {{ vehiculoSeleccionado.ubicacion.ciudad }}</p>
                                
                                <h6 class="text-primary mb-3 mt-4">Contacto</h6>
                                <p><strong>Nombre:</strong> {{ vehiculoSeleccionado.contacto.nombre }}</p>
                                <p><strong>Teléfono:</strong> {{ vehiculoSeleccionado.contacto.telefono }}</p>
                                <p><strong>Email:</strong> {{ vehiculoSeleccionado.contacto.email }}</p>
                            </div>
                        </div>
                        
                        <div v-if="vehiculoSeleccionado.fecha_publicacion" class="text-muted text-end mt-3">
                            <small>Publicado el: {{ formatearFecha(vehiculoSeleccionado.fecha_publicacion) }}</small>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <!-- ============================================== -->
                        <!-- BOTONES EN EL MODAL DE DETALLES               -->
                        <!-- ============================================== -->
                        
                        <!-- Botón RESERVAR (si hay stock y no está reservado) -->
                        <button 
                            v-if="!estaAgotado(vehiculoSeleccionado) && !estaReservado(vehiculoSeleccionado)"
                            type="button" 
                            class="btn btn-info" 
                            @click="abrirModalReserva(vehiculoSeleccionado)"
                        >
                            <i class="bi bi-bookmark me-1"></i> Reservar
                        </button>
                        
                        <!-- Botón CANCELAR RESERVA (si está reservado por mí) -->
                        <button 
                            v-else-if="estaReservadoPorMi(vehiculoSeleccionado)"
                            type="button" 
                            class="btn btn-warning" 
                            @click="cancelarMiReserva(vehiculoSeleccionado); cerrarModal()"
                        >
                            <i class="bi bi-x-circle me-1"></i> Cancelar Mi Reserva
                        </button>
                        
                        <!-- Botón AÑADIR A CESTA -->
                        <button 
                            v-if="!estaAgotado(vehiculoSeleccionado) && !estaReservado(vehiculoSeleccionado)"
                            type="button" 
                            class="btn btn-success" 
                            @click="agregarACesta(vehiculoSeleccionado); cerrarModal()"
                        >
                            <i class="bi bi-cart3 me-1"></i> Añadir a Cesta
                        </button>
                        
                        <!-- Botón AGOTADO (deshabilitado) -->
                        <button 
                            v-if="estaAgotado(vehiculoSeleccionado)"
                            type="button" 
                            class="btn btn-danger" 
                            disabled
                        >
                            <i class="bi bi-x-circle me-1"></i> AGOTADO
                        </button>
                        
                        <!-- Indicador RESERVADO (si está reservado por otro) -->
                        <button 
                            v-if="estaReservado(vehiculoSeleccionado) && !estaReservadoPorMi(vehiculoSeleccionado)"
                            type="button" 
                            class="btn btn-secondary" 
                            disabled
                        >
                            <i class="bi bi-lock me-1"></i> RESERVADO
                        </button>
                        <!-- ============================================== -->
                        
                        <button type="button" class="btn btn-secondary" @click="cerrarModal">Cerrar</button>
                    </div>
                </div>
            </div>
        </div>

        <!-- ============================================== -->
        <!-- MODAL DE RESERVA DE VEHÍCULO                  -->
        <!-- ============================================== -->
        <!-- 
            Este modal se abre cuando el usuario quiere reservar un coche.
            Pide los datos del usuario para la reserva.
        -->
        <div v-if="mostrarModalReserva" class="modal fade show d-block" tabindex="-1" style="background-color: rgba(0,0,0,0.5);" @click.self="cerrarModalReserva">
            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content">
                    <div class="modal-header bg-info text-white">
                        <h5 class="modal-title">
                            <i class="bi bi-bookmark me-2"></i>
                            Reservar {{ vehiculoAReservar?.marca }} {{ vehiculoAReservar?.modelo }}
                        </h5>
                        <button type="button" class="btn-close btn-close-white" @click="cerrarModalReserva"></button>
                    </div>
                    <div class="modal-body">
                        <p class="text-muted mb-3">
                            Introduce tus datos para reservar este vehículo. 
                            La reserva estará activa hasta que la canceles o realices la compra.
                        </p>
                        
                        <div class="mb-3">
                            <label class="form-label"><strong>Nombre completo *</strong></label>
                            <input 
                                v-model="datosReserva.nombre" 
                                type="text" 
                                class="form-control"
                                placeholder="Tu nombre y apellidos"
                            />
                        </div>
                        
                        <div class="mb-3">
                            <label class="form-label"><strong>DNI/NIF *</strong></label>
                            <input 
                                v-model="datosReserva.dni" 
                                type="text" 
                                class="form-control"
                                placeholder="12345678A"
                            />
                        </div>
                        
                        <div class="mb-3">
                            <label class="form-label"><strong>Teléfono *</strong></label>
                            <input 
                                v-model="datosReserva.telefono" 
                                type="tel" 
                                class="form-control"
                                placeholder="600 000 000"
                            />
                        </div>
                        
                        <div class="mb-3">
                            <label class="form-label"><strong>Email</strong></label>
                            <input 
                                v-model="datosReserva.email" 
                                type="email" 
                                class="form-control"
                                placeholder="correo@ejemplo.com"
                            />
                        </div>
                        
                        <div class="alert alert-info py-2">
                            <small>
                                <i class="bi bi-info-circle me-1"></i>
                                Al reservar, el vehículo quedará bloqueado para otros compradores.
                                Podrás cancelar la reserva en cualquier momento.
                            </small>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" @click="cerrarModalReserva">Cancelar</button>
                        <button 
                            type="button" 
                            class="btn btn-info" 
                            @click="confirmarReserva"
                            :disabled="!datosReservaValidos"
                        >
                            <i class="bi bi-bookmark-check me-1"></i> Confirmar Reserva
                        </button>
                    </div>
                </div>
            </div>
        </div>
        <!-- ============================================== -->
    </div>

</template>
<script setup>
import { ref, onMounted, computed } from "vue";
import { getArticulos, updateArticulo } from "@/api/articulos.js";
import { useCestaStore } from "@/store/cesta";
import placeholderImg from '@/assets/404.jpg'
import Swal from 'sweetalert2'

const vehiculos = ref([]);
const vehiculoSeleccionado = ref(null);
const cestaStore = useCestaStore();

// ============================================== 
// VARIABLES PARA EL SISTEMA DE RESERVAS
// ============================================== 
/**
 * mostrarModalReserva: Controla la visibilidad del modal de reserva
 */
const mostrarModalReserva = ref(false);

/**
 * vehiculoAReservar: El vehículo que se está reservando actualmente
 */
const vehiculoAReservar = ref(null);

/**
 * datosReserva: Datos del usuario que realiza la reserva
 * - nombre: Nombre completo
 * - dni: DNI/NIF del usuario
 * - telefono: Teléfono de contacto
 * - email: Email (opcional)
 */
const datosReserva = ref({
    nombre: '',
    dni: '',
    telefono: '',
    email: ''
});

/**
 * datosReservaValidos: Computed que verifica si los datos obligatorios están completos
 */
const datosReservaValidos = computed(() => {
    return datosReserva.value.nombre.trim() !== '' &&
           datosReserva.value.dni.trim() !== '' &&
           datosReserva.value.telefono.trim() !== '';
});

/**
 * usuarioActual: Obtiene el DNI del usuario logueado desde sessionStorage
 * Se usa para saber si una reserva pertenece al usuario actual
 */
const usuarioActual = computed(() => {
    return sessionStorage.getItem('dni') || '';
});
// ==============================================

onMounted(async () => {
    vehiculos.value = await getArticulos();
    
    // Cargar datos del usuario logueado si existe
    try {
        const nombre = sessionStorage.getItem('userName') || '';
        const dni = sessionStorage.getItem('dni') || '';
        if (nombre) datosReserva.value.nombre = nombre;
        if (dni) datosReserva.value.dni = dni;
    } catch (e) {
        console.warn('No se pudieron cargar datos del usuario', e);
    }
});

// ============================================== 
// FUNCIÓN PARA COMPROBAR SI UN VEHÍCULO ESTÁ AGOTADO
// ============================================== 
const estaAgotado = (vehiculo) => {
    const stock = vehiculo.stock ?? 0;
    return stock <= 0;
};

// ============================================== 
// FUNCIONES PARA EL SISTEMA DE RESERVAS
// ============================================== 
/**
 * estaReservado: Comprueba si el vehículo tiene una reserva activa
 * 
 * @param {Object} vehiculo - El vehículo a comprobar
 * @returns {boolean} - true si está reservado, false si no
 * 
 * CÓMO FUNCIONA:
 * - Busca el campo 'reserva' en el vehículo
 * - Si existe y tiene un 'dni', está reservado
 */
const estaReservado = (vehiculo) => {
    if (!vehiculo) return false;
    return vehiculo.reserva && vehiculo.reserva.dni;
};

/**
 * estaReservadoPorMi: Comprueba si el vehículo está reservado por el usuario actual
 * 
 * @param {Object} vehiculo - El vehículo a comprobar
 * @returns {boolean} - true si está reservado por mí, false si no
 */
const estaReservadoPorMi = (vehiculo) => {
    if (!vehiculo || !vehiculo.reserva) return false;
    const miDni = usuarioActual.value;
    if (!miDni) return false;
    return vehiculo.reserva.dni === miDni;
};

/**
 * abrirModalReserva: Abre el modal para reservar un vehículo
 * 
 * @param {Object} vehiculo - El vehículo a reservar
 */
const abrirModalReserva = (vehiculo) => {
    // Verificar que el usuario esté logueado
    const token = sessionStorage.getItem('token');
    if (!token) {
        Swal.fire({
            icon: 'info',
            title: 'Inicia sesión',
            text: 'Debes iniciar sesión para reservar un vehículo.',
            confirmButtonText: 'Ir al login'
        }).then(() => {
            window.location.href = '/login?redirect=/ventas';
        });
        return;
    }
    
    vehiculoAReservar.value = vehiculo;
    mostrarModalReserva.value = true;
    cerrarModal(); // Cerrar modal de detalles si está abierto
};

/**
 * cerrarModalReserva: Cierra el modal de reserva
 */
const cerrarModalReserva = () => {
    mostrarModalReserva.value = false;
    vehiculoAReservar.value = null;
};

/**
 * confirmarReserva: Guarda la reserva en el vehículo
 * 
 * PROCESO:
 * 1. Valida los datos
 * 2. Crea el objeto de reserva con los datos del usuario
 * 3. Actualiza el vehículo con la reserva
 * 4. Recarga los vehículos para mostrar el cambio
 */
const confirmarReserva = async () => {
    if (!datosReservaValidos.value) {
        Swal.fire({
            icon: 'warning',
            title: 'Datos incompletos',
            text: 'Por favor, completa todos los campos obligatorios.'
        });
        return;
    }
    
    try {
        // Crear objeto de reserva
        const reserva = {
            nombre: datosReserva.value.nombre,
            dni: datosReserva.value.dni,
            telefono: datosReserva.value.telefono,
            email: datosReserva.value.email,
            fecha: new Date().toISOString()
        };
        
        // Obtener el ID del vehículo
        // IMPORTANTE: json-server usa el campo "id" simple, no el _id de MongoDB
        const vehiculoId = vehiculoAReservar.value.id || 
                          vehiculoAReservar.value._id;
        
        // Actualizar el vehículo con la reserva
        await updateArticulo(vehiculoId, {
            ...vehiculoAReservar.value,
            reserva: reserva,
            estado: 'reservado'
        });
        
        // Mostrar mensaje de éxito
        Swal.fire({
            icon: 'success',
            title: '¡Reserva confirmada!',
            text: `Has reservado el ${vehiculoAReservar.value.marca} ${vehiculoAReservar.value.modelo}. Nos pondremos en contacto contigo pronto.`,
            confirmButtonText: 'Entendido'
        });
        
        // Recargar vehículos y cerrar modal
        vehiculos.value = await getArticulos();
        cerrarModalReserva();
        
    } catch (error) {
        console.error('Error al reservar:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No se pudo realizar la reserva. Inténtalo de nuevo.'
        });
    }
};

/**
 * cancelarMiReserva: Cancela la reserva del usuario actual
 * 
 * @param {Object} vehiculo - El vehículo del que cancelar la reserva
 */
const cancelarMiReserva = async (vehiculo) => {
    // Confirmar la acción
    const result = await Swal.fire({
        icon: 'question',
        title: '¿Cancelar reserva?',
        text: `¿Estás seguro de que quieres cancelar tu reserva del ${vehiculo.marca} ${vehiculo.modelo}?`,
        showCancelButton: true,
        confirmButtonText: 'Sí, cancelar',
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
            text: 'Tu reserva ha sido cancelada correctamente.'
        });
        
        // Recargar vehículos
        vehiculos.value = await getArticulos();
        
    } catch (error) {
        console.error('Error al cancelar reserva:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No se pudo cancelar la reserva. Inténtalo de nuevo.'
        });
    }
};
// ==============================================

const urlImagen = (ruta) => {
    // si no hay ruta, usar imagen placeholder importada (resuelto por Vite)
    if (!ruta) return placeholderImg;
    // si ya es URL absoluta
    if (ruta.startsWith('http://') || ruta.startsWith('https://')) return ruta;
    // si viene de json-server con prefijo /public/... (tus fotos en frontend/public),
    // quitar el /public para que el servidor de desarrollo las sirva en la ruta raíz
    if (ruta.startsWith('/public/')) return ruta.replace(/^\/public/, '');
    // si es ruta del servidor como /uploads/..., resolver al backend Express
    if (ruta.startsWith('/uploads')) return `http://localhost:5000${ruta}`;
    // otras rutas relativas -> devolver tal cual (pueden ser servidas por json-server)
    if (ruta.startsWith('/')) return ruta;
    // respaldo
    return placeholderImg;
};

const mostrarDetalles = (vehiculo) => {
    vehiculoSeleccionado.value = vehiculo;
};

const cerrarModal = () => {
    vehiculoSeleccionado.value = null;
};

const formatearFecha = (fecha) => {
    if (!fecha) return '';

    // fecha puede venir como string ISO o como objeto { "$date": "..." }
    let iso = null;
    if (typeof fecha === 'string') {
        iso = fecha;
    } else if (fecha && typeof fecha === 'object') {
        // manejar { "$date": "..." } y posibles anidamientos
        if (fecha.$date) {
            // $date puede ser string o objeto {$numberLong: '...'}
            if (typeof fecha.$date === 'string') iso = fecha.$date;
            else if (fecha.$date.$numberLong) iso = Number(fecha.$date.$numberLong);
        } else if (fecha['$date']) {
            iso = fecha['$date'];
        }
    }

    // si no conseguimos iso, intentar usar Date directamente (por si es timestamp)
    const d = iso ? new Date(iso) : new Date(fecha);
    if (Number.isNaN(d.getTime())) return '';

    return d.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
};

const agregarACesta = (vehiculo) => {
    cestaStore.addProducto({
        id: vehiculo._id,
        nombre: `${vehiculo.marca} ${vehiculo.modelo}`,
        precio: vehiculo.precio,
        imagen: urlImagen(vehiculo.imagen),
        matricula: vehiculo.matricula || '',
        anio: vehiculo.anio || vehiculo.anio || vehiculo.year || '',
        kms: vehiculo.kilometros || vehiculo.kms || ''
    });
};

</script>

<style scoped>
.card-title{
    font-weight: bold;
    text-transform: capitalize;
}

/* ============================================== */
/* ESTILOS PARA EL SISTEMA DE STOCK AGOTADO      */
/* ============================================== */

.card.agotado {
    opacity: 0.7;
}

.overlay-agotado {
    position: absolute;
    inset: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10;
    border-radius: inherit;
    pointer-events: none;
}

.texto-agotado {
    background-color: #dc3545;          /* Rojo Bootstrap danger */
    color: white;
    font-size: 1.8rem;
    font-weight: 800;
    padding: 10px 25px;
    border-radius: 8px;
    transform: rotate(-15deg);
    text-transform: uppercase;
    letter-spacing: 3px;
    box-shadow: 0 4px 15px rgba(220, 53, 69, 0.5);
    border: 3px solid white;
}

/* ============================================== */
/* ESTILOS PARA EL SISTEMA DE RESERVAS (AZUL)    */
/* ============================================== */

/**
 * Tarjeta cuando el vehículo está reservado
 * - Ligera reducción de opacidad
 * - Borde azul para indicar reserva
 */
.card.reservado {
    opacity: 0.85;
    border: 2px solid #0d6efd;
}

/**
 * Overlay que cubre la tarjeta cuando está reservado
 * - Similar al de agotado pero con fondo azul
 */
.overlay-reservado {
    position: absolute;
    inset: 0;
    background: rgba(13, 110, 253, 0.3);  /* Azul semitransparente */
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10;
    border-radius: inherit;
    pointer-events: none;
}

/**
 * Texto "RESERVADO" en azul
 * - Fondo azul intenso (Bootstrap primary)
 * - Texto blanco grande y en negrita
 * - Rotación de -15 grados para efecto de sello
 */
.texto-reservado {
    background-color: #0d6efd;          /* Azul Bootstrap primary */
    color: white;
    font-size: 1.6rem;
    font-weight: 800;
    padding: 10px 25px;
    border-radius: 8px;
    transform: rotate(-15deg);
    text-transform: uppercase;
    letter-spacing: 3px;
    box-shadow: 0 4px 15px rgba(13, 110, 253, 0.5);  /* Sombra azul */
    border: 3px solid white;
}

/* ============================================== */
/* FIN ESTILOS                                   */
/* ============================================== */
</style>