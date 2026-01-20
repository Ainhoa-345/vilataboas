<template>
  <div class="my-1 p-3 border rounded-0 shadow-sm bg-light">
    <h4
      class="text-center my-2 bg-primary-subtle text-primary p-3 rounded mb-4"
    >
      <i class="bi bi-person-fill me-2"></i> Registro de Clientes
    </h4>

    <!-- Formulario -->
    <form @submit.prevent="guardarCliente" class="mb-4">
      <!-- DNI con validación visual -->
      <div class="mb-3 row align-items-center">
        <!-- Columna DNI -->
        <div class="col-md-4 d-flex align-items-center">
          <label for="dni" class="form-label mb-0 w-25">DNI: </label>
          <div class="flex-grow-1 d-flex align-items-center">
            <input
              type="text"
              id="dni"
              v-model="nuevoCliente.dni"
              @blur="validarDni"
              class="form-control w-auto w-25 text-center ms-2"
              :class="[
                { 'is-invalid': !dniValido },
                { 'readonly-input': editando },
              ]"
              :readonly="editando"
              required
              oninvalid="this.setCustomValidity('Por favor, rellene este campo')"
              oninput="this.setCustomValidity('')"
            />
            <button
              type="button"
              class="btn btn btn-primary ms-3 border-0 shadow-none rounded-0"
              @click="buscarClientePorDNI(nuevoCliente.dni)"
              :disabled="editando"
              :aria-disabled="String(editando)"
              title="Buscar por DNI"
            >
              <i class="bi bi-search"></i>
            </button>
          </div>
        </div>

        <!-- RadioButtons -->
        <div class="col-md-3 d-flex align-items-center me-5">
          <label for="tipoCliente" class="form-label me-4 ms-5 mb-0 text-nowrap"
            >Tipo Cliente:</label
          >
          <input type="radio" name="tipoCliente" id="tipoClienteParticular" value="particular">
          <label for="tipoClienteParticular">Particular</label>

          <input type="radio" name="tipoCliente" id="tipoClienteEmpresa" value="empresa">
          <label for="tipoClienteEmpresa">Empresa</label>

        </div>

        <!-- Columna Fecha de Alta a la derecha -->
        <div class="col-md-3 d-flex align-items-center">
          <label for="fecha_alta" class="form-label ms-5 me-3 mb-0 text-nowrap"
            >Fecha de Alta:
          </label>
          <input
            type="date"
            id="fecha_alta"
            v-model="nuevoCliente.fecha_alta"
            class="form-control w-auto"
            required
            oninvalid="this.setCustomValidity('Por favor, rellene este campo')"
            oninput="this.setCustomValidity('')"
          />
        </div>

        <!-- Botón recargar -->
        <div class="col-md-1 ms-auto d-flex align-items-center me-3">
          <button
            type="button"
            class="btn btn btn-primary me-4 border-0 shadow-none rounded-0"
            @click="refrescarPagina"
            title="Refrescar Página"
          >
            <i class="bi bi-arrow-clockwise"></i>
          </button>
        </div>
      </div>

      <!-- Nombre y Apellidos -->
      <div class="mb-3 row g-3 align-items-center">
        <!-- Nombre -->
        <div class="col-md-5 d-flex align-items-center">
          <label for="nombre" class="form-label mb-0 text-nowrap w-25"
            >Nombre:</label
          >
          <input
            type="text"
            id="nombre"
            v-model="nuevoCliente.nombre"
            class="form-control flex-grow-1"
            @blur="capitalizarTexto('nombre')"
            required
          />
        </div>

        <!-- Apellidos -->
        <div class="col-md-6 d-flex align-items-center ms-5">
          <label for="apellidos" class="form-label me-4 mb-0 text-nowrap"
            >Apellidos:</label
          >
          <input
            type="text"
            id="apellidos"
            v-model="nuevoCliente.apellidos"
            class="form-control flex-grow-1 ms-1"
            @blur="capitalizarTexto('apellidos')"
            required
          />
        </div>
      </div>

      <!-- Email y Móvil -->
      <div class="mb-3 row g-3 align-items-center">
        <!-- Email -->
        <div class="col-md-5 d-flex align-items-center">
          <label for="email" class="form-label mb-0 text-nowrap w-25"
            >Email:</label
          >
          <input
            type="email"
            id="email"
            v-model="nuevoCliente.email"
            class="form-control flex-grow-1"
            @blur="validarEmail"
            :class="{ 'is-invalid': !emailValido }"
            required
          />
        </div>

        <!-- Móvil -->
        <div class="col-md-3 d-flex align-items-center">
          <label for="movil" class="form-label me-4 ms-5 mb-0 text-nowrap"
            >Móvil:</label
          >
          <input
            type="tel"
            id="movil"
            v-model="nuevoCliente.movil"
            @blur="validarMovil"
            class="form-control flex-grow-1 text-center ms-4"
            :class="{ 'is-invalid': !movilValido }"
          />
          <button
            type="button"
            class="btn btn-outline-primary ms-2"
            @click="buscarClientePorMovil(nuevoCliente.movil)"
            title="Buscar por móvil"
          >
            <i class="bi bi-search"></i>
          </button>
        </div>
      </div>

      <!-- Contraseña -->
      <div class="mb-3 row g-3 align-items-center">
        <div class="col-md-5 d-flex align-items-center">
          <label for="password" class="form-label mb-0 text-nowrap w-25">Contraseña:</label>
          <input
            type="password"
            id="password"
            v-model="nuevoCliente.password"
            :required="!editando"
            minlength="6"
            class="form-control flex-grow-1"
            placeholder="Mínimo 6 caracteres"
          />
        </div>
      </div>

      <!-- Dirección, Provincia y Municipio -->
      <div class="mb-3 row g-3 align-items-center">
        <!-- Dirección -->
        <div class="col-md-5 d-flex align-items-center">
          <label for="direccion" class="form-label mb-0 w-25 text-nowrap"
            >Dirección:</label
          >
          <input
            type="text"
            id="direccion"
            @blur="capitalizarTexto('direccion')"
            v-model="nuevoCliente.direccion"
            class="form-control flex-grow-1"
          />
        </div>

        <!-- Provincia -->
        <div class="col-md-3 d-flex align-items-center me-1">
          <label for="provincia" class="form-label me-4 ms-5 mb-0 text-nowrap"
            >Provincia:</label
          >
          <select
            id="provincia"
            v-model="nuevoCliente.provincia"
            class="form-select flex-grow-1 w-25"
            @change="filtrarMunicipios"
          >
            <option disabled value="">Seleccione provincia</option>
            <option v-for="prov in provincias" :key="prov" :value="prov.nm">
              {{ prov.nm }}
            </option>
          </select>
        </div>

        <!-- Municipio -->
        <div class="col-md-3 d-flex align-items-center">
          <label for="municipio" class="form-label me-2 ms-4 mb-0 text-nowrap"
            >Municipio:</label
          >
          <select
            id="municipio"
            v-model="nuevoCliente.municipio"
            class="form-select flex-grow-1 w-auto"
          >
            <option disabled value="">Seleccione municipio</option>
            <option
              v-for="mun in municipiosFiltrados"
              :key="mun"
              :value="mun.nm"
            >
              {{ mun.nm }}
            </option>
          </select>
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
              <input
                type="checkbox"
                id="avisoLegal"
                class="form-check-input me-2"
                v-model="nuevoCliente.lopd"
                required
              />
              <label for="avisoLegal" class="form-check-label mb-0 text-nowrap">
                Aceptar términos y condiciones:
                <a
                  target="_blank"
                  class="text-decoration-none"
                  href="/AvisoLegal"
                >
                  Aviso Legal
                </a>
              </label>
            </div>
          </div>

          <!-- Histórico (derecha) -->
          <div class="ms-auto me-5">
            <!-- Histórico solo visible para admin -->
            <div v-if="isAdmin" class="form-switch d-flex align-items-center">
              <input
                type="checkbox"
                id="historico"
                v-model="mostrarHistorico"
                class="form-check-input me-2"
                @change="cargarClientes"
              />
              <label for="historico" class="form-check-label mb-0"
                >Histórico</label
              >
            </div>
          </div>
        </div>
      </div>

     <!-- Botón centrado (centro) -->
      <div class="d-flex justify-content-center align-items-center">
        <button
          type="submit"
          class="btn btn-primary border-0 shadow-none rounded-0"
        >
          {{ editando ? "Modificar Cliente" : "Guardar" }}
        </button>
        <button type="button" class="btn btn-secondary ms-3" @click="refrescarPagina">Limpiar</button>
      </div>
    </form>
  <!-- Lista de Clientes (solo admin) -->
  <div v-if="isAdmin" class="table-responsive">
      <h4 class="text-center w-100">Listado Clientes</h4>
      <table class="table table-bordered table-striped w-100 align-middle">
        <thead class="table-primary">
          <tr>
            <th class="text-center">ID</th>
            <th class="text-center">Apellidos</th>
            <th class="text-center">Nombre</th>
            <th class="text-center">Móvil</th>
            <th class="text-center">Municipio</th>
            <th class="text-center" style="width: 170px">Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(cliente, index) in clientesPaginados" :key="index">
            <th scope="row" class="text-center">{{ index + 1 }}</th>
            <td>{{ cliente.apellidos }}</td>
            <td>{{ cliente.nombre }}</td>
            <td class="text-center">{{ cliente.movil }}</td>
            <td class="text-center">{{ cliente.municipio }}</td>
            <td class="text-nowrap text-start">
              <button
                @click="eliminarCliente(cliente.movil)"
                class="btn btn-danger btn-sm ms-4 me-2 border-0 shadow-none rounded-1"
                title="Eliminar cliente"
                aria-label="Eliminar cliente"
              >
                <i class="bi bi-trash"></i>
              </button>
              <button
                @click="editarCliente(cliente.movil)"
                class="btn btn-warning btn-sm border-0 shadow-none rounded-1"
                title="Editar cliente"
                aria-label="Editar cliente"
              >
                <i class="bi bi-pencil"></i>
              </button>
              <button
                v-if="cliente.historico == false"
                @click="activarCliente(cliente)"
                class="btn btn-secondary btn-sm ms-2 border-0 shadow-none rounded-1"
                title="Activar cliente"
              >
                <i class="bi bi-person-check"></i>
              </button>
            </td>
          </tr>
        </tbody>
      </table>
      <!-- Navegación de página-->
      <div class="d-flex justify-content-center my-3">
        <button
          class="btn btn-outline-primary btn-sm me-2 rounded-0 border-1 shadow-none"
          @click="beforePagina"
          :disabled="currentPage <= 1"
        >
          <i class="bi bi-chevron-left"></i>
        </button>
        <span class="mx-3 align-self-center text-muted"
          >Página {{ currentPage }}</span
        >
        <button
          class="btn btn-outline-primary btn-sm rounded-0 border-1 shadow-none"
          @click="nextPagina"
          :disabled="currentPage >= totalPages"
        >
          <i class="bi bi-chevron-right"></i>
        </button>
      </div>
    </div>
    <div v-else class="alert alert-secondary text-center">
      A área de xestión de clientes só está dispoñible para administradores.
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from "vue";
import Swal from "sweetalert2";
import provmuniData from "@/data/provmuni.json";

import {
  getClientes,
  addCliente,
  updateCliente,
  deleteCliente,
  getClientePorDni
} from "@/api/clientes.js";

import { checkAdmin } from "@/api/authApi.js";

/* ===================== ESTADO BASE ===================== */
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
  historico: true,
  tipoCliente: "particular",
  lopd: false,
  password: "",
};

const nuevoCliente = ref({ ...clienteVacio });

const isAdmin = ref(false);
const editando = ref(false);
const clienteEditandoId = ref(null);
const clienteOriginalPassword = ref("");

const mostrarHistorico = ref(false); // muestra clientes activos por defecto


/* ===================== LISTADO ===================== */
const clientes = ref([]);
const numClientes = ref(0);
const currentPage = ref(1);
const clientesPorPage = 10;

/* ===================== VALIDACIONES ===================== */
const dniValido = ref(true);
const emailValido = ref(true);
const movilValido = ref(true);

/* ===================== PROVINCIAS / MUNICIPIOS ===================== */
const provincias = ref(provmuniData.provincias);
const municipios = ref(provmuniData.municipios);
const municipiosFiltrados = ref([]);

/* ===================== CICLO DE VIDA ===================== */
onMounted(async () => {
  try {
    // 🔐 CONTROL DE ADMIN
    isAdmin.value = checkAdmin(); // Devuelve true solo si user.tipo === "admin"

    if (isAdmin.value) {
      await cargarClientes();
    }
  } catch (error) {
    console.error("Error comprobando permisos de admin:", error);
    isAdmin.value = false;
  }
});

/* ===================== CRUD ===================== */
const cargarClientes = async () => {
  try {
    const data = await getClientes(); // ignorando el parámetro
    console.log("Clientes recibidos:", data);
    clientes.value = data;
    numClientes.value = data.length;
    currentPage.value = 1;
  } catch (error) {
    console.error("Error cargando clientes:", error);
  }
};


const guardarCliente = async () => {
  normalizarCliente();

  if (!dniValido.value || !emailValido.value || !movilValido.value) {
    Swal.fire("Error", "Hay campos inválidos", "error");
    return;
  }

  const confirm = await Swal.fire({
    title: editando.value ? "¿Modificar cliente?" : "¿Guardar cliente?",
    icon: "warning",
    showCancelButton: true,
  });

  if (!confirm.isConfirmed) return;

  const payload = { ...nuevoCliente.value };

  if (editando.value) {
    if (!payload.password) payload.password = clienteOriginalPassword.value;
    await updateCliente(clienteEditandoId.value, payload);
  } else {
    if (!payload.password) {
      Swal.fire("Error", "La contraseña es obligatoria", "error");
      return;
    }
    await addCliente(payload);
  }

  Swal.fire("Éxito", "Operación realizada", "success");
  refrescarFormulario();
  await cargarClientes();
};

const eliminarCliente = async (id) => {
  const confirm = await Swal.fire({
    title: "¿Eliminar cliente?",
    icon: "warning",
    showCancelButton: true,
  });

  if (!confirm.isConfirmed) return;

  await deleteCliente(id);
  await cargarClientes();
};

const editarCliente = (movil) => {
  const cliente = clientes.value.find((c) => c.movil === movil);
  if (!cliente) return;

  nuevoCliente.value = { ...cliente };
  clienteOriginalPassword.value = cliente.password || "";
  nuevoCliente.value.password = "";
  nuevoCliente.value.fecha_alta = formatearFecha(cliente.fecha_alta);

  filtrarMunicipios();
  editando.value = true;
  clienteEditandoId.value = cliente.id;
};

/* ===================== BUSQUEDAS ===================== */
const buscarClientePorDNI = async (dni) => {
  const cliente = await getClientePorDni(dni);
  if (!cliente) {
    Swal.fire("Info", "Cliente no encontrado", "info");
    return;
  }
  editarCliente(cliente.movil);
};

/* ===================== VALIDACIONES ===================== */
const validarDni = () => {
  const v = nuevoCliente.value.dni.toUpperCase();
  nuevoCliente.value.dni = v;
  dniValido.value = validarDniNie(v);
};

const validarEmail = () => {
  emailValido.value = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(nuevoCliente.value.email);
};

const validarMovil = () => {
  movilValido.value = /^[67]\d{8}$/.test(nuevoCliente.value.movil);
};

const validarDniNie = (valor) => {
  const letras = "TRWAGMYFPDXBNJZSQVHLCKE";
  if (/^\d{8}[A-Z]$/.test(valor)) {
    return letras[parseInt(valor.slice(0, 8)) % 23] === valor[8];
  }
  if (/^[XYZ]\d{7}[A-Z]$/.test(valor)) {
    const num = valor.replace("X", "0").replace("Y", "1").replace("Z", "2");
    return letras[parseInt(num.slice(0, 8)) % 23] === valor[8];
  }
  return false;
};

/* ===================== UTILIDADES ===================== */
const normalizarCliente = () => {
  ["nombre", "apellidos", "direccion"].forEach(capitalizarTexto);
};

const capitalizarTexto = (campo) => {
  nuevoCliente.value[campo] = nuevoCliente.value[campo]
    .toLowerCase()
    .replace(/\b\w/g, (l) => l.toUpperCase());
};

const filtrarMunicipios = () => {
  const prov = provincias.value.find(
    (p) => p.nm === nuevoCliente.value.provincia
  );
  municipiosFiltrados.value = prov
    ? municipios.value.filter((m) => m.id.startsWith(prov.id.slice(0, 2)))
    : [];
};

const refrescarFormulario = () => {
  nuevoCliente.value = { ...clienteVacio };
  editando.value = false;
  clienteEditandoId.value = null;
  dniValido.value = emailValido.value = movilValido.value = true;
};

/* ===================== PAGINACIÓN ===================== */
const clientesPaginados = computed(() => {
  const start = (currentPage.value - 1) * clientesPorPage;
  return clientes.value.slice(start, start + clientesPorPage);
});

const totalPages = computed(() =>
  Math.ceil(numClientes.value / clientesPorPage)
);

const nextPagina = () => {
  if (currentPage.value < totalPages.value) currentPage.value++;
};

const beforePagina = () => {
  if (currentPage.value > 1) currentPage.value--;
};

/* ===================== FECHAS ===================== */
const formatearFecha = (fecha) => {
  if (!fecha) return "";
  if (fecha.includes("/")) {
    const [d, m, y] = fecha.split("/");
    return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }
  return fecha;
};
</script>


<style scoped>
.form-control {
  width: 100%;
}

.is-invalid {
  border-color: #f28b82 !important;
  background-color: #ffe6e6;
}

.invalid-feedback {
  display: block;
}

/* Visual for readonly/locked inputs when editing a cliente */
.readonly-input {
  background-color: #eef2f6 !important; /* soft gray */
  cursor: not-allowed;
  color: #495057; /* slightly muted text color */
}

#fecha_alta + button {
  margin-left: auto !important;
}
</style>