<template>
  <div class="mx-auto mt-2 p-3 pb-5 border rounded-3 shadow-sm min-vh-75 bg-light">
    <h3 class="text-center my-2">Registro de Clientes</h3>
    <!-- Formulario -->
    <form @submit.prevent="guardarCliente" class="mb-4">
      <!-- DNI con validación visual -->
      <div class="mb-3 row align-items-center">
        <!-- Columna DNI -->
        <div class="col-md-4 d-flex align-items-center">
          <label for="dni" class="form-label mb-0 w-25 me-5">DNI: </label>
          <div class="flex-grow-1 d-flex align-items-center">
            <input type="text" id="dni" v-model="nuevoCliente.dni" @blur="validarDni"
              class="form-control w-auto w-25 text-center ms-4" :class="[
                { 'is-invalid': !dniValido },
                { 'readonly-input': editando },
              ]" :readonly="editando" required oninvalid="this.setCustomValidity('Por favor, rellene este campo')"
              oninput="this.setCustomValidity('')" @blur.stop.prevent="capitalizarDni" />
            <button type="button" class="btn btn btn-primary ms-3 border-0 shadow-none rounded-0"
              @click="buscarClientePorDNI(nuevoCliente.dni)" :disabled="editando" :aria-disabled="String(editando)"
              title="Buscar por DNI">
              <i class="bi bi-search"></i>
            </button>

            <div v-if="!dniValido" class="invalid-feedback">
              {{ dniError || 'DNI o NIE inválido.' }}
            </div>
          </div>
        </div>
        <!-- RadioButtons -->
        <div class="col-md-3 d-flex align-items-center me-5">
          <label for="tipoCliente" class="form-label me-4 ms-5 mb-0 text-nowrap">Tipo Cliente:</label>
          <input type="radio" name="tipoCliente" id="tipoClienteParticular" value="particular" class="me-1"
            v-model="nuevoCliente.tipoCliente" checked required />
          <label class="me-4">Particular</label>
          <input type="radio" name="tipoCliente" id="tipoClienteEmpresa" value="empresa" class="me-1"
            v-model="nuevoCliente.tipoCliente" required />
          <label>Empresa</label>
        </div>

        <!-- Columna Fecha de Alta a la derecha -->
        <div class="col-md-4 ms-auto d-flex align-items-center">
          <label for="fecha_alta" class="form-label me-2 mb-0 text-nowrap">Fecha de Alta:</label>
          <input type="date" id="fecha_alta" v-model="nuevoCliente.fecha_alta" class="form-control w-auto" required
            oninvalid="this.setCustomValidity('Por favor, rellene este campo')" oninput="this.setCustomValidity('')" />

          <!-- Botón recargar eliminado (removed curved-arrow refresh button) -->
        </div>
      </div>

      <!-- Nombre y Apellidos -->
      <div class="mb-3 row g-3 align-items-center">
        <!-- Nombre -->
        <div class="col-md-5 d-flex align-items-center">
          <label for="nombre" class="form-label mb-0 text-nowrap w-25">Nombre:</label>
          <input type="text" id="nombre" v-model="nuevoCliente.nombre" class="form-control flex-grow-1"
            @blur="capitalizarTexto('nombre')" required />
        </div>

        <!-- Apellidos -->
        <div class="col-md-4 d-flex align-items-center ms-5">
          <label for="apellidos" class="form-label me-4 mb-0 text-nowrap">Apellidos:</label>
          <input type="text" id="apellidos" v-model="nuevoCliente.apellidos" class="form-control flex-grow-1"
            @blur="capitalizarTexto('apellidos')" required />
        </div>
      </div>

      <!-- Email y Móvil -->
      <div class="mb-3 row g-3 align-items-center">
        <!-- Email -->
        <div class="col-md-5 d-flex align-items-center">
          <label for="email" class="form-label mb-0 text-nowrap w-25">Email:</label>
          <input type="email" id="email" v-model="nuevoCliente.email" class="form-control flex-grow-1"
            @blur="validarEmail" :class="{ 'is-invalid': !emailValido }" required />
        </div>

        <!-- Móvil -->
        <div class="col-md-3 d-flex align-items-center">
          <label for="movil" class="form-label me-4 ms-5 mb-0 text-nowrap">Móvil:</label>
          <div class="d-flex flex-grow-1">
            <input type="tel" id="movil" v-model="nuevoCliente.movil" @blur="validarMovil"
              class="form-control flex-grow-1 text-center" :class="{ 'is-invalid': !movilValido }" />
            <button type="button" class="btn btn-primary ms-2" @click="buscarClientePorMovil(nuevoCliente.movil)" :disabled="!nuevoCliente.movil || editando">
              <i class="bi bi-search"></i>
            </button>
          </div>
        </div>
      </div>

      <!-- Dirección, Provincia y Municipio -->
      <div class="mb-3 row g-3 align-items-center">
        <!-- Dirección -->
        <div class="col-md-5 d-flex align-items-center">
          <label for="direccion" class="form-label mb-0 w-25 text-nowrap">Dirección:</label>
          <input type="text" id="direccion" v-model="nuevoCliente.direccion" class="form-control flex-grow-1" @blur="capitalizarTexto('direccion')" />
        </div>

        <!-- Provincia -->
        <div class="col-md-3 d-flex align-items-center">
          <label for="provincia" class="form-label me-2 ms-5 mb-0 text-nowrap">Provincia:</label>
          <select id="provincia" v-model="nuevoCliente.provincia" class="form-select flex-grow-1 w-25"
            @change="filtrarMunicipios">
            <option disabled value="">Seleccione provincia</option>
            <option v-for="prov in provincias" :key="prov.id" :value="prov.nm">
              {{ prov.nm }}
            </option>
          </select>
        </div>

        <!-- Municipio -->
        <div class="col-md-3 d-flex align-items-center">
          <label for="municipio" class="form-label me-2 ms-4 mb-0 text-nowrap">Municipio:</label>
          <select id="municipio" v-model="nuevoCliente.municipio" class="form-select flex-grow-1 w-auto">
            <option disabled value="">Seleccione municipio</option>
            <option v-for="mun in municipiosFiltrados" :key="mun.id" :value="mun.nm">
              {{ mun.nm }}
            </option>
          </select>
        </div>
      </div>
      <!-- Contraseña y Repetir Contraseña (solo al crear nuevo cliente) -->
      <div v-if="!editando" class="mb-3 row g-3 align-items-center justify-content-center">
        <div class="col-md-4 d-flex align-items-center">
          <label for="password" class="form-label mb-0 text-nowrap flex-shrink-0 me-2">Contraseña:</label>
          <input
            type="password"
            id="password"
            v-model="nuevoCliente.password"
            class="form-control flex-grow-1"
            required
            autocomplete="new-password"
          />
        </div>
        <div class="col-md-4 d-flex align-items-center ms-4">
          <label for="repetirPassword" class="form-label mb-0 text-nowrap flex-shrink-0 me-2">Repetir Contraseña:</label>
          <input
            type="password"
            id="repetirPassword"
            v-model="repetirPassword"
            class="form-control flex-grow-1"
            required
            autocomplete="new-password"
          />
        </div>
      </div>
      <!-- Aceptar condiciones + Histórico -->
      <div class="mb-4">
        <div class="d-flex align-items-center justify-content-between position-relative">
          <!-- Espacio izquierdo vacío para equilibrar -->
          <div style="flex: 1"></div>

          <!-- Aceptar condiciones y términos (centro absoluto) -->
          <div class="position-absolute start-50 translate-middle-x">
            <div class="form-check d-flex align-items-center">
              <input type="checkbox" id="avisoLegal" class="form-check-input me-2" v-model="nuevoCliente.lopd"
                required />
              <label for="AvisoLegal" class="form-check-label mb-0 text-nowrap">
                Aceptar términos y condiciones:
                <a target="_blank" class="text-decoration-none" href="/avisolegal">
                  Aviso Legal
                </a>
              </label>
            </div>
          </div>

          <!-- Histórico (derecha) - solo visible para admins -->
          <div v-if="admin" class="ms-auto me-5">
            <div class="form-switch d-flex align-items-center">
              <input type="checkbox" id="historico" v-model="mostrarHistorico" class="form-check-input me-2"
                @change="cargarClientes" />
              <label for="historico" class="form-check-label mb-0">Histórico</label>
            </div>
          </div>
        </div>
      </div>
      <!-- Botones centrados: Imprimir (si admin) | Guardar | Vaciar (icono refrescar) -->
      <div class="d-flex justify-content-center align-items-center gap-3">
        <!-- Imprimir: aparece a la izquierda de Guardar y con el mismo estilo -->
        <button v-if="admin" type="button" class="btn btn-primary border-0 shadow-none rounded-0" @click="imprimirListado" title="Imprimir listado" aria-label="Imprimir listado">
          <i class="bi bi-printer"></i>
          <span class="ms-1">Imprimir listado</span>
        </button>

        <button type="submit" class="btn btn-primary border-0 shadow-none rounded-0">
          {{ editando ? "Modificar Cliente" : "Guardar" }}
        </button>

        <!-- Vaciar ahora es un icono de refrescar -->
        <button id="vaciarBtn" type="button" class="btn btn-secondary border-0 shadow-none rounded-0" @click="clearClicked" title="Vaciar formulario" aria-label="Vaciar formulario">
          <i class="bi bi-arrow-clockwise"></i>
        </button>
      </div>
    </form>
  </div>

  <!--Aceptar condiciones + Histórico
  <div class="mb-4">
    <div class="d-flex align-items-center justify-content-between position-relative">
      Espacio izquierdo vacío para equilibrar 
      <div style="flex: 1"></div>

      Aceptar condiciones y términos (centro absoluto) 
      <div class="position-absolute start-50 translate-middle-x">
        <div class="form-check d-flex align-items-center">
          <input type="checkbox" id="avisoLegal" class="form-check-input me-2" v-model="nuevoCliente.lopd" required />
          <label for="AvisoLegal" class="form-check-label mb-0 text-nowrap">
            Aceptar términos y condiciones:
            <a target="_blank" class="text-decoration-none" href="/avisolegal">
              Aviso Legal
            </a>
          </label>
        </div>
      </div>

      Histórico (derecha) 
      <div class="ms-auto me-5">
        <div class="form-switch d-flex align-items-center">
          <input type="checkbox" id="historico" v-model="mostrarHistorico" class="form-check-input me-2"
            @change="cargarClientes" />
          <label for="historico" class="form-check-label mb-0">Histórico</label>
        </div>
      </div>
    </div>
  </div>-->

  <!-- Botón centrado (centro) 
  <div class="d-flex justify-content-center align-items-center">
    <button type="submit" class="btn btn-primary border-0 shadow-none rounded-0">
      {{ editando ? "Modificar Cliente" : "Guardar" }}
    </button>
  </div>-->

  <!-- Lista de Clientes -->
  <div v-if="admin" class="table-responsive">
    <div class="d-flex align-items-center justify-content-between mb-2">
      <h4 class="m-0">Listado Clientes</h4>
      <!-- El botón de imprimir se ha movido al formulario (a la izquierda de Guardar) -->
    </div>
    <table class="table table-bordered table-striped table-hover table-sm align-middle">
      <thead class="table-primary">
        <tr>
          <th class="text-center" scope="col">ID</th>
          <th scope="col">Apellidos</th>
          <th scope="col">Nombre</th>
          <th class="text-center" scope="col">Móvil</th>
          <th class="text-center" scope="col">Municipio</th>
          <th class="text-center" scope="col" style="width: 150px">
            Acciones
          </th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(cliente, index) in clientesPaginados" :key="cliente.id || index">
          <th scope="row" class="text-center">{{ (currentPage - 1) * clientesPerPage + index + 1 }}</th>
          <td>{{ cliente.apellidos }}</td>
          <td>{{ cliente.nombre }}</td>
          <td class="text-center">{{ cliente.movil }}</td>
          <td class="text-center">{{ cliente.municipio }}</td>
          <td class="text-start">

            <div class="btn-group" role="group" aria-label="acciones-cliente">
              <!-- Eliminar: visible y activo solo para clientes NO históricos.
                   Usamos la clase 'invisible' para mantener el espacio y que el layout no salte -->
              <button
                @click="eliminarCliente(cliente.id)"
                class="btn btn-danger btn-sm border-0 shadow-none rounded-0"
                :disabled="cliente.historico === true"
                title="Dar de baja (enviar a histórico)"
              >
                <i class="bi bi-trash"></i>
              </button>

              <!-- Editar: disponible siempre -->
              <button
                @click="editarCliente(cliente.id)"
                class="btn btn-warning btn-sm ms-2 shadow-none rounded-0"
                title="Editar cliente"
                aria-label="Editar cliente"
              >
                <i class="bi bi-pencil"></i>
              </button>

              <!-- Reactivar: visible SOLO cuando el modo 'Histórico' está activado y el cliente está en histórico -->
              <button
                v-if="mostrarHistorico && (cliente.historico === true || cliente.historico === 'true' || cliente.historico === 1)"
                @click="activarCliente(cliente)"
                class="btn btn-secondary btn-sm ms-2 shadow-none rounded-0"
                title="Activar cliente"
              >
                <i class="bi bi-person-check"></i>
              </button>
            </div>
           </td>
         </tr>
       </tbody>
     </table>
   </div>

  <!-- Navegación de página-->
  <div v-if="admin" class="d-flex justify-content-center my-3">
    <button class="btn btn-outline-primary btn-sm me-2 rounded-0 border-1 shadow-none" @click="beforePagina"
      :disabled="currentPage <= 1">
      <i class="bi bi-chevron-left "></i>
    </button>
    <span class="mx-3 align-self-center text-muted">Página {{ currentPage }}</span>
    <button class="btn btn-outline-primary btn-sm rounded-0 border-1 shadow-none" @click="nextPagina"
      :disabled="currentPage >= totalPages">
      <i class="bi bi-chevron-right "></i>
    </button>
  </div>

  <!-- DEBUG: mostrar estado crudo mientras depuras -->
  <!-- <div v-if="admin" class="p-3 bg-white border rounded mt-3">
    <strong>DEBUG:</strong>
    <div>isAdmin: {{ isAdmin }}</div>
    <div>admin: {{ admin }}</div>
    <div>numClientes: {{ numClientes }}</div>
    <pre style="max-height:200px; overflow:auto; white-space:pre-wrap;">{{ JSON.stringify(clientes, null, 2) }}</pre>
  </div> -->
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed, watch } from "vue";
import { useRouter } from "vue-router";
import provmuniData from "@/data/provmuni.json";
// Logo para impresión (Vite asset import)
import logoEmpresa from "@/assets/logoEmpresaTeis.svg";
import Swal from "sweetalert2";
import { getClientes, deleteCliente, addCliente, updateCliente, patchCliente, getClientePorDni, getClientePorMovil, getDni, getClienteLogueado } from "@/api/clientes.js";
import { registerUsuario, loginUsuario, checkAdmin } from "@/api/authApi.js";

const router = useRouter();

/* =================================== SCRIPT CRUD =================================== */
const clienteVacio = {
  dni: "",
  nombre: "",
  apellidos: "",
  email: "",
  movil: "",
  direccion: "",
  provincia: "",
  municipio: "",
  fecha_alta: "",
  tipo_cliente: "",
  tipoCliente: "particular",
  historico: false,
  lopd: false,
  password: "",
  tipo: "user"
}

const nuevoCliente = ref({
  ...clienteVacio
});

const repetirPassword = ref("");

const editando = ref(false);
const clienteEditandoId = ref(null);

var mostrarHistorico = ref(false);

var numClientes = ref(0);
var currentPage = ref(1);
var clientesPerPage = ref(10);

const isAdmin = ref(false);
const admin = ref(false)

/// se carga en el onmounted ya que necesita llamar al back
var dni;

/// Computed: verifica si está editando su propio perfil
const editingCurrentUser = computed(() => {
  return nuevoCliente.value.dni === dni && editando.value;
});

/// Función Listar Clientes con get
const clientes = ref([]);

/// Cargar clientes al montar el componente
// Zona Cargar clientes Al Montar el componente 
onMounted(async () => {
  try {
    const resp = await checkAdmin();
    // soportar { isAdmin: true }, { admin: true } o booleano simple
    if (typeof resp === "boolean") {
      isAdmin.value = resp;
    } else if (resp && typeof resp === "object") {
      isAdmin.value = !!(resp.isAdmin || resp.admin || resp.is_admin || resp.isadministrator);
    } else {
      isAdmin.value = Boolean(resp);
    }
    console.debug("checkAdmin response:", resp, "isAdmin:", isAdmin.value);

    // sincronizar flag usado en el template
    admin.value = isAdmin.value;

    if (isAdmin.value) {
      await cargarClientes();
    } else {
      clientes.value = [];
      numClientes.value = 0;
    }
  } catch (error) {
    console.error("onMounted error:", error);
    clientes.value = [];
    numClientes.value = 0;
  }

  // Adjuntar listener nativo de clic al botón Vaciar para depurar problemas de overlay/binding
  try {
    const vaciarEl = document.getElementById('vaciarBtn');
    if (vaciarEl) {
      vaciarEl.addEventListener('click', onNativeVaciarClick);
    }
  } catch (e) {
    console.debug('onMounted: fallo al adjuntar listener nativo', e);
  }
})

onUnmounted(() => {
  try {
    const vaciarEl = document.getElementById('vaciarBtn');
    if (vaciarEl) vaciarEl.removeEventListener('click', onNativeVaciarClick);
  } catch (e) {
    console.debug('onUnmounted: fallo al eliminar listener nativo', e);
  }
});

const updateTabla = async () => {
  try {
    await cargarClientes();
  } catch (e) {
    console.error("updateTabla error:", e);
  }
};

///avanzar y retroceder

// Métodos de paginación
const beforePagina = () => {
  if (currentPage.value > 1) {
    currentPage.value--;
  }
};

const nextPagina = () => {
  //redondear hacia arriba para mostrar la última página aunque no esté completa

  if (currentPage.value < totalPages.value) {
    currentPage.value++;
  }
};

const clientesPaginados = computed(() => {
  const start = (currentPage.value - 1) * clientesPerPage.value
  const end = start + clientesPerPage.value
  return clientes.value.slice(start, end)
})


const cargarClientes = async () => {
  try {
    currentPage.value = 1;
    console.debug("Solicitando clientes, incluirHistorico=", mostrarHistorico.value);
    const data = await getClientes(mostrarHistorico.value);
    console.debug("Respuesta GET /api/clientes:", data);
    const raw = Array.isArray(data) ? data : [];
    // Si mostrarHistorico está activo: incluir también los históricos (mostrar todos).
    // Si está desactivado: mostrar solo activos (no históricos).
    if (mostrarHistorico.value) {
      clientes.value = raw.slice();
    } else {
      clientes.value = raw.filter(c => !(c.historico === true || c.historico === 'true' || c.historico === 1 || c.historico === '1'));
    }
     numClientes.value = clientes.value.length;
     currentPage.value = 1;
   } catch (error) {
     console.error("Error cargando clientes:", error);
     clientes.value = [];
     numClientes.value = 0;
   }
 };

// recargar cuando se cambie el switch de histórico
watch(mostrarHistorico, async () => {
  if (isAdmin.value) await cargarClientes();
});

// Opcional: recargar si isAdmin cambia a true en runtime
watch(isAdmin, async (val) => {
  if (val) await cargarClientes();
});

const totalPages = computed(() => {
  return Math.ceil(numClientes.value / clientesPerPage.value)
})


const guardarCliente = async () => {
  // Validar contraseñas:
  // - Si estamos creando (no editando) => las contraseñas deben coincidir
  // - Si estamos editando y se proporciona una nueva contraseña => deben coincidir
  if (!editando.value) {
    if (nuevoCliente.value.password !== repetirPassword.value) {
      Swal.fire({ icon: 'error', title: 'Error en contraseña', text: 'Las contraseñas no coinciden.', showConfirmButton: true });
      return;
    }
  } else {
    if (nuevoCliente.value.password && nuevoCliente.value.password !== repetirPassword.value) {
      Swal.fire({ icon: 'error', title: 'Error en contraseña', text: 'Las contraseñas no coinciden.', showConfirmButton: true });
      return;
    }
  }

  // Validar duplicados solo si estás creando (no si editando)
  if (!editando.value) {
    const duplicado = clientes.value.find(cliente =>
      cliente.dni === nuevoCliente.value.dni ||
      cliente.movil === nuevoCliente.value.movil ||
      cliente.email === nuevoCliente.value.email
    );
    if (duplicado) {
      Swal.fire({
        icon: 'error',
        title: 'DNI, móvil o email duplicados',
        showConfirmButton: false,
        timer: 2000
      });
      return;
    }
  }

  // Confirmación antes de guardar
  const result = await Swal.fire({
    title: editando.value ? '¿Desea modificar este cliente?' : '¿Desea grabar este cliente?',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: editando.value ? 'Modificar' : 'Grabar',
    cancelButtonText: 'Cancelar'
  });

  if (!result.isConfirmed) return;

  try {
    if (editando.value) {
      // MODIFICAR CLIENTE EXISTENTE
      const datosActualizados = { ...nuevoCliente.value };
      // Delegar el hash al backend: enviar la contraseña en claro y que el servidor la procese
      if (nuevoCliente.value.password) {
        datosActualizados.password = nuevoCliente.value.password;
      } else {
        delete datosActualizados.password;
      }
      await updateCliente(clienteEditandoId.value, datosActualizados); // <-- MODIFICA EL EXISTENTE

      Swal.fire({
        icon: 'success',
        title: 'Cliente modificado',
        showConfirmButton: false,
        timer: 1500
      });
    } else {
      // CREAR NUEVO CLIENTE
      await registerUsuario({
        dni: nuevoCliente.value.dni,
        password: nuevoCliente.value.password,
        nombre: nuevoCliente.value.nombre,
        apellidos: nuevoCliente.value.apellidos,
        email: nuevoCliente.value.email,
        movil: nuevoCliente.value.movil,
        direccion: nuevoCliente.value.direccion,
        provincia: nuevoCliente.value.provincia,
        municipio: nuevoCliente.value.municipio,
        fecha_alta: nuevoCliente.value.fecha_alta,
        tipo_cliente: nuevoCliente.value.tipoCliente,
        lopd: nuevoCliente.value.lopd
      });

      Swal.fire({
        icon: 'success',
        title: 'Cliente agregado',
        showConfirmButton: false,
        timer: 1500
      });
    }

    // Reset formulario y estado
    nuevoCliente.value = { ...clienteVacio };
    editando.value = false;
    clienteEditandoId.value = null;
    repetirPassword.value = "";

    // Refrescar lista completa
    updateTabla();

  } catch (error) {
    console.error('Error al guardar cliente:', error);

    // Manejo específico de errores de validación/duplicados devueltos por el backend
    const status = error?.response?.status;
    const data = error?.response?.data || {};

    if (status === 409) {
      // Conflicto por duplicado: backend devuelve { message, field }
      const field = data.field || null;
      const msg = data.message || 'Campo duplicado';

      // Marcar visualmente el campo como inválido si es uno de los esperados
      if (field === 'dni') dniValido.value = false;
      if (field === 'dni') dniError.value = msg;
      if (field === 'email') emailValido.value = false;
      if (field === 'movil') movilValido.value = false;

      Swal.fire({ icon: 'error', title: 'Conflicto', text: msg, timer: 3000, showConfirmButton: false });
      return;
    }

    // Errores de validación del servidor (400) con detalles
    if (status === 400 && data && data.field) {
      const field = data.field;
      const msg = data.message || 'Error en campo';
      if (field === 'dni') dniValido.value = false;
      if (field === 'dni') dniError.value = msg;
      if (field === 'email') emailValido.value = false;
      if (field === 'movil') movilValido.value = false;
      Swal.fire({ icon: 'error', title: 'Error de validación', text: msg, timer: 3000, showConfirmButton: false });
      return;
    }

    // Otros errores: mostrar mensaje por defecto
    Swal.fire({
      icon: 'error',
      title: 'Error al guardar cliente',
      text: data?.message || error.message || 'Inténtelo de nuevo o contacte con el administrador.',
      showConfirmButton: false,
      timer: 3000
    });
  }
};

// Imprimir listado de clientes (solo admins)
const imprimirListado = () => {
  try {
    const listado = Array.isArray(clientes.value) ? clientes.value : [];
    const incluirHistorico = mostrarHistorico.value ? ' (incluye históricos)' : '';

    const escapeHtml = (s) => String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

    const rows = listado.map((c, idx) => `
      <tr>
        <td style="text-align:center">${idx + 1}</td>
        <td>${escapeHtml(c.dni)}</td>
        <td>${escapeHtml(c.apellidos)}</td>
        <td>${escapeHtml(c.nombre)}</td>
        <td>${escapeHtml(c.email)}</td>
        <td style="text-align:center">${escapeHtml(c.movil)}</td>
        <td>${escapeHtml(c.municipio)}</td>
        <td>${escapeHtml(c.provincia)}</td>
        <td>${escapeHtml(c.fecha_alta)}</td>
      </tr>
    `).join('');

    const style = `
      <style>
        /* Asegurar layout imprimible y posición para el logo */
        body{font-family:Arial,Helvetica,sans-serif;padding:16px;color:#222;position:relative}
        .logo-print{position:absolute;top:10px;right:10px;width:80px;height:auto}
        table{width:100%;border-collapse:collapse;margin-top:48px}
        th,td{border:1px solid #ddd;padding:6px;font-size:12px}
        th{background:#f5f5f5;text-align:left}
        h1{font-size:18px;margin:0}
      </style>
    `;

    const html = `
      <html>
        <head>
          <title>Listado Clientes</title>
          ${style}
        </head>
        <body>
          <!-- Logo de la empresa en la esquina superior derecha -->
          <img src="${logoEmpresa}" class="logo-print" alt="Logo empresa" />

          <h1>Listado de clientes${incluirHistorico}</h1>
          <table>
            <thead>
              <tr>
                <th style="width:50px">#</th>
                <th>DNI</th>
                <th>Apellidos</th>
                <th>Nombre</th>
                <th>Email</th>
                <th style="width:120px;text-align:center">Móvil</th>
                <th>Municipio</th>
                <th>Provincia</th>
                <th>Fecha alta</th>
              </tr>
            </thead>
            <tbody>
              ${rows}
            </tbody>
          </table>
        </body>
      </html>
    `;

    const w = window.open('', '_blank');
    if (!w) {
      Swal.fire({ icon: 'error', title: 'Popup bloqueado', text: 'Permite popups para imprimir el listado.' });
      return;
    }
    w.document.open();
    w.document.write(html);
    w.document.close();
    // esperar un poco a que renderice y lanzar imprimir
    setTimeout(() => {
      try { w.focus(); w.print(); } catch (e) { console.warn('print error', e); }
    }, 350);
  } catch (e) {
    console.error('Error imprimiendo listado:', e);
    Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudo preparar el listado para impresión.' });
  }
};

// Funcion Eliminar Cliente: marcar historico (no borrar) usando el id
const eliminarCliente = async (id) => {
  // refrescar lista antes de operar
  await updateTabla();
  const clienteAEliminar = clientes.value.find(c => String(c.id) === String(id));

  if (!clienteAEliminar) {
    Swal.fire({
      icon: 'error',
      title: 'Cliente no encontrado',
      showConfirmButton: false,
      timer: 1500
    });
    return;
  }

  // Pedir confirmación antes de eliminar
  const result = await Swal.fire({
    title: `¿Eliminar al cliente ${clienteAEliminar.nombre} ${clienteAEliminar.apellidos}?`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Sí, eliminar',
    cancelButtonText: 'Cancelar'
  });


  // Si no confirma, salir
  if (!result.isConfirmed) return;

  // marcar como histórico (baja) en vez de borrar
  try {
    // DAR DE BAJA => marcar solo el campo historico usando PATCH para evitar conflictos por duplicados
    const actualizado = await patchCliente(clienteAEliminar.id, { historico: true });
    // actualizar lista local
    const idx = clientes.value.findIndex(c => c.id === clienteAEliminar.id);
    if (idx !== -1) clientes.value[idx] = { ...clientes.value[idx], ...actualizado };
    await cargarClientes();
  } catch (error) {
    console.error('Error marcando histórico:', error);
    const status = error?.response?.status;
    const data = error?.response?.data;
    if (status === 409) {
      const field = data?.field || 'campo';
      const msg = data?.message || `Conflicto en ${field}`;
      Swal.fire({ icon: 'error', title: 'No se puede eliminar', text: msg, timer: 2500 });
    } else if (status === 502) {
      Swal.fire({ icon: 'error', title: 'Servicio de datos no disponible', text: 'Inténtalo más tarde.', timer: 2500 });
    } else {
      Swal.fire({ icon: 'error', title: 'Error al eliminar cliente', timer: 1500 });
    }
    return;
  }

  Swal.fire({
    icon: 'success',
    title: 'Cliente eliminado',
    showConfirmButton: false,
    timer: 1500
  });
};


// Función Editar Cliente (carga datos en el formulario)
const editarCliente = (id) => {
  const cliente = clientes.value.find((c) => String(c.id) === String(id));
  if (!cliente) return;
  nuevoCliente.value = { 
    ...cliente, 
    password: "",
    // Mapear tipo_cliente del backend a tipoCliente del formulario
    tipoCliente: cliente.tipo_cliente || 'particular'
  };
  editando.value = true;
  clienteEditandoId.value = cliente.id;
  nuevoCliente.value.fecha_alta = formatearFechaParaInput(cliente.fecha_alta);
}


const activarCliente = async (cliente) => {
  const confirmacion = await Swal.fire({
    title: `¿Activar cliente ${cliente.nombre} ${cliente.apellidos}?`,
    icon: 'question',
    showCancelButton: true,
    confirmButtonText: 'Activar',
    cancelButtonText: 'Cancelar'
  });

  if (!confirmacion.isConfirmed) return;

  try {
    // Hacemos PATCH solo del campo historico para evitar conflictos por duplicados
    const actualizado = await patchCliente(cliente.id, { historico: false });

    // Actualizar la lista local (opcional, también puedes volver a cargar todo)
    const index = clientes.value.findIndex(c => c.id === cliente.id);
    if (index !== -1) {
      // conservar otros campos locales y actualizar solo historico
      clientes.value[index] = { ...clientes.value[index], ...actualizado };
    }

    Swal.fire({
      icon: 'success',
      title: 'Cliente reactivado',
      showConfirmButton: false,
      timer: 1500
    });

    // Recargar lista actualizada
    cargarClientes();

  } catch (error) {
    console.error('Error al reactivar cliente:', error);
    // Mostrar mensaje más informativo si es conflicto por duplicados
    const status = error?.response?.status;
    const data = error?.response?.data;
    if (status === 409) {
      const field = data?.field || 'campo';
      const msg = data?.message || `Conflicto en ${field}`;
      Swal.fire({ icon: 'error', title: 'No se puede reactivar', text: msg, timer: 2500 });
    } else if (status === 502) {
      Swal.fire({ icon: 'error', title: 'Servicio de datos no disponible', text: 'Inténtalo más tarde.', timer: 2500 });
    } else {
      Swal.fire({ icon: 'error', title: 'Error al activar cliente', text: 'Por favor, intenta de nuevo.', timer: 1500 });
    }
    return;
  }
};

///CODIGO BUSQUEDA COMPONENTES

const buscarClientePorDNI = async (dni) => {
  if (!dni || dni.trim() === '') {
    Swal.fire({
      icon: 'warning',
      title: 'Debe introducir un DNI antes de buscar.',
      timer: 1500,
      showConfirmButton: false
    });
    return;
  }

  try {
    const cliente = await getClientePorDni(dni.trim().toUpperCase());
    console.log('Datos de mi perfil:', cliente); // <-- Añade esto

    if (!cliente) {
      // Si no se encuentra en el backend, ofrecer ir a la búsqueda interna del sitio
      const { isConfirmed } = await Swal.fire({
        icon: 'info',
        title: 'Cliente no encontrado',
        text: 'No existe ningún cliente con ese DNI en nuestra base. ¿Desea buscar en todo el sitio?',
        showCancelButton: true,
        confirmButtonText: 'Buscar en el sitio',
        cancelButtonText: 'Cerrar'
      });

      if (isConfirmed) {
        // Navegar al componente de búsqueda con el término
        router.push({ path: '/buscar', query: { q: dni.trim().toUpperCase() } });
      }
      return;
    }

    // ✅ Cargar los datos en el formulario
    nuevoCliente.value = { ...cliente, password: "" };
    nuevoCliente.value.fecha_alta = formatearFechaParaInput(cliente.fecha_alta);

    // Actualiza lista de municipios si cambia la provincia
    filtrarMunicipios();
    nuevoCliente.value.municipio = cliente.municipio;

    //opcional
    editando.value = true;
    clienteEditandoId.value = cliente.id;

    Swal.fire({
      icon: 'success',
      title: 'Cliente encontrado y cargado',
      timer: 1500,
      showConfirmButton: false
    });
  } catch (error) {
    console.error('Error buscando cliente por DNI:', error);
    const status = error?.response?.status;

    // Si no está autenticado o hay error de acceso, ofrecer buscar en el sitio en lugar de abrir buscadores externos
    if (status === 401 || status === 403 || !status) {
      try {
        await Swal.fire({ icon: 'info', title: 'Búsqueda interna', text: 'No está autenticada o no se puede acceder al servicio. Puede buscar en todo el sitio.', timer: 1200, showConfirmButton: false });
      } catch (e) { /* ignorable */ }
      router.push({ path: '/buscar', query: { q: dni.trim().toUpperCase() } });
      return;
    }

    Swal.fire({
      icon: 'error',
      title: 'Error al buscar cliente',
      text: 'Verifique la conexión o contacte con el administrador.',
      timer: 2000,
      showConfirmButton: false
    });
  }
}
const buscarClientePorMovil = async (movil) => {
  if (!movil || movil.trim() === '') {
    Swal.fire({ icon: 'warning', title: 'Debe introducir un móvil antes de buscar.', timer: 1500, showConfirmButton: false });
    return;
  }

  try {
    const cliente = await getClientePorMovil(movil.trim());
    if (!cliente) {
      // Ofrecer buscar el número en la búsqueda interna del sitio si no existe en la base de datos
      const { isConfirmed } = await Swal.fire({
        icon: 'info',
        title: 'Cliente no encontrado',
        text: 'No existe ningún cliente con ese móvil en nuestra base. ¿Desea buscar en todo el sitio?',
        showCancelButton: true,
        confirmButtonText: 'Buscar en el sitio',
        cancelButtonText: 'Cerrar'
      });

      if (isConfirmed) {
        router.push({ path: '/buscar', query: { q: movil.trim() } });
      }
      return;
    }

    // Cargar los datos en el formulario como en buscar por DNI
    nuevoCliente.value = { ...cliente, password: "" };
    nuevoCliente.value.fecha_alta = formatearFechaParaInput(cliente.fecha_alta);
    filtrarMunicipios();
    nuevoCliente.value.municipio = cliente.municipio;
    editando.value = true;
    clienteEditandoId.value = cliente.id;

    Swal.fire({ icon: 'success', title: 'Cliente encontrado y cargado', timer: 1500, showConfirmButton: false });
  } catch (error) {
    console.error('Error buscando cliente por móvil:', error);
    const status = error?.response?.status;

    // Si no está autenticado o hay error de acceso, redirigir a la búsqueda interna del sitio
    if (status === 401 || status === 403 || !status) {
      try {
        await Swal.fire({ icon: 'info', title: 'Búsqueda interna', text: 'No está autenticada o no se puede acceder al servicio. Puede buscar en todo el sitio.', timer: 1200, showConfirmButton: false });
      } catch (e) { /* ignorable */ }
      router.push({ path: '/buscar', query: { q: movil.trim() } });
      return;
    }

    Swal.fire({ icon: 'error', title: 'Error al buscar cliente', text: 'Verifique la conexión o contacte con el administrador.', timer: 2000, showConfirmButton: false });
  }
};
const vaciarFormulario = async () => {
  // Log de depuración para confirmar la ejecución del manejador
  console.debug('vaciarFormulario: limpiando formulario');

  // Reiniciar todo el objeto de una vez para asegurar que los v-model se limpien.
  // Incluir tanto `tipoCliente` (usado por el formulario) como `tipo_cliente` (usado por el backend)
  nuevoCliente.value = {
    ...clienteVacio,
    tipoCliente: 'particular',
    tipo_cliente: clienteVacio.tipo_cliente || '',
  };

  // Limpiar estado auxiliar de la UI
  repetirPassword.value = "";
  editando.value = false;
  clienteEditandoId.value = null;
  municipiosFiltrados.value = [];

  // Reiniciar flags/mensajes de validación
  dniValido.value = true;
  movilValido.value = true;
  emailValido.value = true;
  dniError.value = "";

  // Pequeña confirmación para que el usuario vea que la acción se ejecutó
  try {
    Swal.fire({
      icon: 'success',
      title: 'Formulario vaciado',
      timer: 900,
      showConfirmButton: false,
      toast: true,
      position: 'top-end'
    });
  } catch (e) {
    // noop si Swal no está disponible por cualquier razón
    console.debug('vaciarFormulario: Swal no disponible', e);
  }
}

// Manejador click envoltorio para el botón Vaciar para poder detectar eventos de clic
const clearClicked = (event) => {
  console.debug('clearClicked: Botón Vaciar clicado', event);
  try {
    // llamar a la función de reinicio async pero no esperar aquí (funciona de cualquier forma)
    vaciarFormulario();
  } catch (e) {
    console.error('clearClicked: error al llamar vaciarFormulario', e);
  }
};

// Función listener nativa usada solo para depuración y detectar eventos de clic
function onNativeVaciarClick(ev) {
  console.debug('onNativeVaciarClick: clic DOM nativo detectado', ev);
}

/* =================================== SCRIPT AUXILIARES =================================== */

// Estado de validez del DNI/NIE si la estructura de datos es más compleja se usa reactive
const dniValido = ref(true); // Por defecto es válido y no muestra error al iniciar
// Mensaje de error detallado para el campo DNI (se muestra cuando dniValido === false)
const dniError = ref("");

// Función para validar DNI y NIE
const validarDniNie = (valor) => {
  const letras = "TRWAGMYFPDXBNJZSQVHLCKE";
  const dniRegex = /^[0-9]{8}[A-Z]$/;
  const nieRegex = /^[XYZ][0-9]{7}[A-Z]$/;

  valor = valor.toUpperCase();

  if (dniRegex.test(valor)) {
    const numero = parseInt(valor.slice(0, 8), 10);
    const letra = valor.charAt(8);
    return letra === letras[numero % 23]; //sale con true si es válido
  } else if (nieRegex.test(valor)) {
    const nie = valor.replace("X", "0").replace("Y", "1").replace("Z", "2");
    const numero = parseInt(nie.slice(0, 8), 10);
    const letra = valor.charAt(8);
    return letra === letras[numero % 23]; //sale con true si es válido
  }
  return false;
};

// Validar al salir del campo con mensajes específicos
const validarDni = () => {
  const dni = (nuevoCliente.value.dni || "").trim().toUpperCase();

  // Reiniciar mensaje
  dniError.value = "";

  if (!dni) {
    dniValido.value = false;
    dniError.value = 'El DNI está vacío.';
    return;
  }

  const dniRegex = /^[0-9]{8}[A-Z]$/;
  const nieRegex = /^[XYZ][0-9]{7}[A-Z]$/;

  // Formato básico
  if (!dniRegex.test(dni) && !nieRegex.test(dni)) {
    dniValido.value = false;
    dniError.value = 'Formato inválido. Debe ser 8 dígitos + letra (DNI) o empezar por X/Y/Z para NIE.';
    return;
  }

  // Si el formato es correcto, comprobar la letra
  const letras = "TRWAGMYFPDXBNJZSQVHLCKE";
  let numeroStr = dni.slice(0, 8);
  // Para NIE, sustituir la letra inicial por su valor numérico
  if (/^[XYZ]/.test(dni)) {
    numeroStr = dni.replace('X', '0').replace('Y', '1').replace('Z', '2').slice(0, 8);
  }

  const numero = parseInt(numeroStr, 10);
  const letraEsperada = letras[numero % 23];
  const letraReal = dni.charAt(8);

  if (letraEsperada !== letraReal) {
    dniValido.value = false;
    dniError.value = `Letra incorrecta. La letra esperada para ese número es ${letraEsperada}.`;
    return;
  }

  // Si todo pasa
  dniValido.value = true;
  dniError.value = "";
};

// Capitalizar/forzar mayúsculas del DNI en blur
const capitalizarDni = () => {
  nuevoCliente.value.dni = (nuevoCliente.value.dni || '').trim().toUpperCase();
};

// Función única: capitaliza y asigna en el mismo paso
const capitalizarTexto = (campo) => {
  const texto = nuevoCliente.value[campo] ?? "";
  nuevoCliente.value[campo] = texto
    .toLowerCase()
    .split(" ")
    .map((palabra) => {
      if (!palabra) return "";
      return palabra.charAt(0).toLocaleUpperCase() + palabra.slice(1);
    })
    .join(" ");
};

// Validar email
const emailValido = ref(true);
const validarEmail = () => {
  const email = nuevoCliente.value.email.trim();
  // Expresión simple para email válido
  const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  emailValido.value = regex.test(email);
};

// Validar móvil
const movilValido = ref(true);
const movilRegex = /^[67]\d{8}$/;

const validarMovil = () => {
  const movil = nuevoCliente.value.movil.trim();

  if (movil === "") {
    movilValido.value = true; // Vacío = válido (opcional)
    return true;
  }

  if (movil.charAt(0) === "6" || movil.charAt(0) === "7") {
    movilValido.value = movilRegex.test(movil);
    return movilValido.value;
  } else {
    movilValido.value = false;
    return false;
  }
};

// Provincias y municipios
const provincias = ref(provmuniData.provincias); // Array de provincias
const municipios = ref(provmuniData.municipios); // Array de municipios para filtrarlos
const municipiosFiltrados = ref([]); // vacío pero contendrá los municipios filtrados

const filtrarMunicipios = () => {
  // nombre de la provincia elegida en el <select>
  const nombreProv = nuevoCliente.value.provincia;

  // 1️⃣ buscar en provincias el objeto con ese nombre
  const prov = provincias.value.find((p) => p.nm === nombreProv);
  if (!prov) {
    municipiosFiltrados.value = [];
    return;
  }

  // 2️⃣ los dos primeros dígitos del id de la provincia
  const codigoProv = prov.id.slice(0, 2);

  // 3️⃣ filtrar los municipios cuyo id empiece por esos dos dígitos
  municipiosFiltrados.value = municipios.value.filter((m) =>
    m.id.startsWith(codigoProv)
  );

  // 4️⃣ opcional: resetear el municipio si ya no corresponde
  nuevoCliente.value.municipio = "";
};

// conversor fecha
function formatearFechaParaInput(fecha) {
  if (!fecha) return '';

  // Detecta formato dd/mm/yyyy
  if (fecha.includes('/')) {
    const [dd, mm, yyyy] = fecha.split('/');
    return `${yyyy}-${mm.padStart(2, '0')}-${dd.padStart(2, '0')}`;
  }

  // Detecta formato yyyy-mm-dd
  if (fecha.includes('-')) {
    const partes = fecha.split('-');
    if (partes.length === 3) return fecha.slice(0, 10); // solo yyyy-mm-dd
  }

  // Detecta formato ISO (ejemplo: 2026-01-21T00:00:00.000Z)
  if (fecha.length >= 10 && fecha[4] === '-' && fecha[7] === '-') {
    return fecha.slice(0, 10);
  }

  return '';
}
</script>

<style scoped>
.is-invalid {
  border-color: #f28b82 !important;
  background-color: #ffe6e6;
}

.invalid-feedback {
  display: block;
}

#app>main>div>form>div:nth-child(2)>div.col-md-6.d-flex.align-items-center.ms-auto {
  margin-left: 48px !important;
}

.gestion-clientes {
  width: 95%;
  max-width: none;
  margin: 0 auto;
  padding: 2rem 0;
}

.form-control {
  width: 100%;
}
</style>