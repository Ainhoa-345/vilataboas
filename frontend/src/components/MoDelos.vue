<template>
  <div class="container-fluid my-4 p-4 border rounded-4 shadow-lg bg-white">
    <h4 class="text-center mb-4 fw-semibold text-primary border-bottom pb-2 mt-2">
      <i class="bi bi-car-front me-2"></i>Registro de Vehículos
    </h4>

    <form @submit.prevent="guardarVehiculo" class="mb-2 mt-1">

      <!-- FILA: Tipo, Marca, Modelo -->
      <div class="row g-3 align-items-center mt-1">

        <div class="col-12 col-md-3">
          <label class="form-label mb-1 text-nowrap">Tipo:</label>
          <div>
            <div class="form-check form-check-inline">
              <input class="form-check-input" type="radio" id="tipo-coche" value="coche" v-model="vehiculo.tipo" />
              <label class="form-check-label" for="tipo-coche">Coche</label>
            </div>
            <div class="form-check form-check-inline">
              <input class="form-check-input" type="radio" id="tipo-furgoneta" value="furgoneta" v-model="vehiculo.tipo" />
              <label class="form-check-label" for="tipo-furgoneta">Furgoneta</label>
            </div>
            <div class="form-check form-check-inline">
              <input class="form-check-input" type="radio" id="tipo-moto" value="moto" v-model="vehiculo.tipo" />
              <label class="form-check-label" for="tipo-moto">Moto</label>
            </div>
          </div>
        </div>

        <div class="col-12 col-md-2">
          <label for="marca" class="form-label mb-1 text-nowrap">Marca:</label>
          <input type="text" id="marca" v-model="vehiculo.marca" @blur="capitalizarTexto('marca')"
            class="form-control rounded-0 shadow-none border" required />
        </div>

        <div class="col-12 col-md-2">
          <label for="modelo" class="form-label mb-1 text-nowrap">Modelo:</label>
          <input type="text" id="modelo" v-model="vehiculo.modelo" @blur="capitalizarTexto('modelo')"
            class="form-control rounded-0 shadow-none border" required />
        </div>

        <div class="col-12 col-md-2">
          <label for="matricula" class="form-label mb-1 text-nowrap">Matrícula:</label>
          <input type="text" id="matricula" v-model="vehiculo.matricula"
            class="form-control rounded-0 shadow-none border" />
        </div>

        <div class="col-12 col-md-2">
          <label for="anio" class="form-label mb-1 text-nowrap">Año:</label>
          <input type="number" id="anio" v-model="vehiculo.anio"
            class="form-control rounded-0 shadow-none border text-end" required />
        </div>
      </div>

      <!-- FILA: Kilómetros, Precio, Combustible, Transmisión, Potencia -->
      <div class="row g-3 align-items-center mt-2">

        <div class="col-12 col-md-2">
          <label for="kilometros" class="form-label mb-1 text-nowrap">Kilómetros:</label>
          <input type="number" id="kilometros" v-model="vehiculo.kilometros"
            class="form-control rounded-0 shadow-none border text-end" required />
        </div>

        <div class="col-12 col-md-2">
          <label for="precio" class="form-label mb-1 text-nowrap">Precio (€):</label>
          <input type="number" id="precio" v-model="vehiculo.precio"
            class="form-control rounded-0 shadow-none border text-end" required />
        </div>

        <div class="col-12 col-md-2">
          <label for="combustible" class="form-label mb-1 text-nowrap">Combustible:</label>
          <select id="combustible" v-model="vehiculo.combustible" class="form-select rounded-0 shadow-none border">
            <option disabled value="">Seleccione</option>
            <option>Gasolina</option>
            <option>Diésel</option>
            <option>Híbrido</option>
            <option>GLP</option>
            <option>Eléctrico</option>
          </select>
        </div>

        <div class="col-12 col-md-3">
          <label class="form-label mb-1 text-nowrap">Transmisión:</label>
          <div>
            <div class="form-check form-check-inline">
              <input class="form-check-input" type="radio" id="transmision-manual" value="manual"
                v-model="vehiculo.transmision" />
              <label class="form-check-label" for="transmision-manual">Manual</label>
            </div>
            <div class="form-check form-check-inline">
              <input class="form-check-input" type="radio" id="transmision-automatica" value="automatica"
                v-model="vehiculo.transmision" />
              <label class="form-check-label" for="transmision-automatica">Automática</label>
            </div>
          </div>
        </div>

        <div class="col-12 col-md-2">
          <label for="potencia" class="form-label mb-1 text-nowrap">Potencia (CV):</label>
          <input type="number" id="potencia" v-model="vehiculo.potencia_cv"
            class="form-control rounded-0 shadow-none border text-end" />
        </div>

      </div>

      <!-- DESCRIPCIÓN -->
      <div class="col g-2 mt-3">
        <label for="descripcion" class="form-label">Descripción:</label>
        <textarea id="descripcion" v-model="vehiculo.descripcion" rows="3"
          class="form-control rounded shadow-none border mb-2"
          placeholder="Describe el estado, revisiones, etc."></textarea>
      </div>

      <!-- IMAGEN -->
      <div class="row g-3 align-items-center mb-3">
        <div class="col-12 col-md-3">
          <label for="foto" class="form-label mb-1 text-nowrap">Imagen del Vehículo:</label>
          <input type="file" id="foto" accept="image/*" @change="onFileChange"
            class="form-control border rounded-0 shadow-none" />
        </div>
      </div>

      <!-- UBICACIÓN -->
      <h6 class="text-center fw-semibold bg-primary-subtle py-1 rounded">
        <i class="bi bi-person me-2"></i>Cliente Ubicación
      </h6>

      <div class="row g-3 align-items-center mt-3">
        <div class="col-12 col-md-4">
          <label for="provincia" class="form-label">Provincia:</label>
          <select id="provincia" v-model="vehiculo.ubicacion.provincia" class="form-select rounded shadow-none border"
            @change="filtrarCiudades">
            <option disabled value="">Seleccione provincia</option>
            <option v-for="prov in provincias" :key="prov.id" :value="prov.nm">{{ prov.nm }}</option>
          </select>
        </div>

        <div class="col-12 col-md-4">
          <label for="ciudad" class="form-label">Ciudad:</label>
          <select id="ciudad" v-model="vehiculo.ubicacion.ciudad" class="form-select rounded shadow-none border">
            <option disabled value="">Seleccione ciudad</option>
            <option v-for="mun in municipiosFiltrados" :key="mun.id" :value="mun.nm">{{ mun.nm }}</option>
          </select>
        </div>

        <div class="col-12 col-md-4">
          <label for="fecha_publicacion" class="form-label">Fecha Publicación:</label>
          <input type="date" id="fecha_publicacion" v-model="vehiculo.fecha_publicacion"
            class="form-control rounded shadow-none border" />
        </div>
      </div>

      <!-- CONTACTO -->
      <div class="row g-3 align-items-center mt-3">
        <div class="col-12 col-md-4">
          <label for="contacto_nombre" class="form-label">Nombre Contacto:</label>
          <input type="text" id="contacto_nombre" v-model="vehiculo.contacto.nombre"
            @blur="capitalizarContacto('nombre')" class="form-control rounded shadow-none border" />
        </div>

        <div class="col-12 col-md-4">
          <label for="contacto_telefono" class="form-label">Teléfono:</label>
          <input type="tel" id="contacto_telefono" v-model="vehiculo.contacto.telefono" @blur="validarTelefono"
            class="form-control rounded shadow-none border text-center" :class="{ 'is-invalid': !telefonoValido }" />
          <div v-if="!telefonoValido" class="invalid-feedback">
            Teléfono inválido (debe empezar por 6 o 7 y tener 9 dígitos).
          </div>
        </div>

        <div class="col-12 col-md-4">
          <label for="contacto_email" class="form-label">Email:</label>
          <input type="email" id="contacto_email" v-model="vehiculo.contacto.email" @blur="validarEmail"
            class="form-control rounded shadow-none border" :class="{ 'is-invalid': !emailValido }" />
          <div v-if="!emailValido" class="invalid-feedback">
            Email inválido.
          </div>
        </div>
      </div>

      <!-- ESTADO + BOTÓN -->
      <div class="d-flex align-items-center justify-content-between mt-3">
        <div>
          <label class="form-label me-2">Estado:</label>
          <select v-model="vehiculo.estado" class="form-select d-inline-block w-auto rounded shadow-none border">
            <option value="disponible">Disponible</option>
            <option value="vendido">Vendido</option>
            <option value="reservado">Reservado</option>
          </select>
        </div>

        <button class="btn btn-primary rounded border shadow-none px-4" type="submit">
          {{ editando ? "Modificar" : "Guardar" }}
        </button>
      </div>

    </form>
  
      <!-- TABLA DE VEHÍCULOS -->
      <div class="table-responsive mt-4">
        <h5 class="mb-3">Listado de Vehículos</h5>
        <table class="table table-sm table-striped table-bordered align-middle">
          <thead class="table-light">
            <tr>
              <th>Matrícula</th>
              <th>Marca</th>
              <th>Modelo</th>
              <th class="text-center">Estado</th>
              <th>Contacto</th>
              <th class="text-center">Acción</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(item, idx) in articulos" :key="item._id || item.id || idx">
              <td>{{ item.matricula || '-' }}</td>
              <td>{{ item.marca || '-' }}</td>
              <td>{{ item.modelo || '-' }}</td>
              <td class="text-center text-capitalize">
                <span v-if="item.estado === 'disponible'" class="badge bg-success">Disponible</span>
                <span v-else-if="item.estado === 'reservado'" class="badge bg-warning text-dark">Reservado</span>
                <span v-else-if="item.estado === 'vendido'" class="badge bg-danger text-white">Vendido</span>
                <span v-else class="badge bg-light text-dark">{{ item.estado || '-' }}</span>
            </td>
              <td>
                <div>{{ (item.contacto && (item.contacto.nombre || item.contacto.telefono)) ? (item.contacto.nombre || '') + (item.contacto.telefono ? ' • ' + item.contacto.telefono : '') : '-' }}</div>
                <div class="text-muted small">{{ item.contacto?.email || '' }}</div>
              </td>
              <td class="text-center">
                <button
                  @click="editarVehiculo(item)"
                  class="btn btn-warning btn-sm ms-2 shadow-none rounded-0"
                  title="Editar vehículo"
                  aria-label="Editar vehículo"
                >
                  <i class="bi bi-pencil"></i>
                </button>
              </td>
            </tr>
            <tr v-if="articulos.length === 0">
              <td colspan="6" class="text-center text-muted">No hay vehículos guardados.</td>
            </tr>
          </tbody>
        </table>
      </div>
  </div>
</template>


<script setup>
import Swal from "sweetalert2"
import { ref, computed, onMounted } from "vue"
import { addArticulo, getArticulos, updateArticulo } from "@/api/articulos.js"
import provmuniData from "@/data/provmuni.json"

const vehiculo = ref({
  tipo: "",
  matricula: "",
  marca: "",
  modelo: "",
  anio: "",
  estado: "",
  kilometros: "",
  precio: "",
  combustible: "",
  transmision: "",
  potencia_cv: "",
  descripcion: "",
  ubicacion: {
    provincia: "",
    ciudad: ""
  },
  contacto: {
    nombre: "",
    telefono: "",
    email: ""
  },
  fecha_publicacion: "",
  estado: "disponible"
})

const imagenFile = ref(null);

const editando = ref(false);
const articuloEditandoId = ref(null);

const articulos = ref([]);

const cargarArticulos = async () => {
  try {
    const data = await getArticulos();
    articulos.value = Array.isArray(data) ? data : [];
  } catch (e) {
    console.error('Error cargando articulos:', e);
    articulos.value = [];
  }
};

onMounted(() => {
  cargarArticulos();
});

// Cargar provincias y municipios desde JSON
const provincias = ref(provmuniData.provincias);
const municipios = ref(provmuniData.municipios);
const municipiosFiltrados = ref([]);

// Filtrar municipios según provincia seleccionada
const filtrarCiudades = () => {
  const nombreProv = vehiculo.value.ubicacion.provincia;
  const prov = provincias.value.find((p) => p.nm === nombreProv);
  if (!prov) {
    municipiosFiltrados.value = [];
    return;
  }
  const codigoProv = prov.id.slice(0, 2);
  municipiosFiltrados.value = municipios.value.filter((m) =>
    m.id.startsWith(codigoProv)
  );
  vehiculo.value.ubicacion.ciudad = "";
};

const capitalizarTexto = (campo) => {
  const texto = vehiculo.value[campo] ?? "";
  if (texto.trim() === "") return;
  vehiculo.value[campo] = texto
    .toLowerCase()
    .split(" ")
    .map((palabra) => {
      if (!palabra) return "";
      return palabra.charAt(0).toUpperCase() + palabra.slice(1);
    })
    .join(" ");
};

const capitalizarContacto = (campo) => {
  const texto = vehiculo.value.contacto[campo] ?? "";
  if (texto.trim() === "") return;
  vehiculo.value.contacto[campo] = texto
    .toLowerCase()
    .split(" ")
    .map((palabra) => {
      if (!palabra) return "";
      return palabra.charAt(0).toUpperCase() + palabra.slice(1);
    })
    .join(" ");
};

// Validar teléfono
const telefonoValido = ref(true);
const telefonoRegex = /^[67]\d{8}$/;

const validarTelefono = () => {
  const telefono = vehiculo.value.contacto.telefono.trim();

  if (telefono === "") {
    telefonoValido.value = true; // Vacío = válido (opcional)
    return true;
  }

  if (telefono.charAt(0) === "6" || telefono.charAt(0) === "7") {
    telefonoValido.value = telefonoRegex.test(telefono);
    return telefonoValido.value;
  } else {
    telefonoValido.value = false;
    return false;
  }
};

// Validar email
const emailValido = ref(true);
const validarEmail = () => {
  const email = vehiculo.value.contacto.email.trim();
  if (email === "") {
    emailValido.value = true; // Vacío = válido (opcional)
    return true;
  }
  const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  emailValido.value = regex.test(email);
};

// Enviar datos al backend
const guardarVehiculo = async () => {
  // Validar teléfono antes de guardar
  if (!telefonoValido.value) {
    Swal.fire({
      icon: 'error',
      title: 'Teléfono inválido',
      text: 'El teléfono debe empezar por 6 o 7 y tener 9 dígitos.',
      showConfirmButton: true
    });
    return;
  }

  // Validar email antes de guardar
  if (!emailValido.value) {
    Swal.fire({
      icon: 'error',
      title: 'Email inválido',
      text: 'Por favor, introduce un email válido.',
      showConfirmButton: true
    });
    return;
  }

  try {
    if (editando.value && articuloEditandoId.value) {
      const actualizado = await updateArticulo(articuloEditandoId.value, vehiculo.value);
      Swal.fire({ icon: 'success', title: 'Vehículo modificado', timer: 1500, showConfirmButton: false });
    } else {
      // Construir FormData esperado por el backend (campo 'vehiculo' y opcional 'imagen')
      const formData = new FormData();
      formData.append('vehiculo', JSON.stringify(vehiculo.value));
      if (imagenFile.value) {
        formData.append('imagen', imagenFile.value);
      }
      const nuevo = await addArticulo(formData);
      if (nuevo && (nuevo._id || nuevo.id)) {
        Swal.fire({ icon: 'success', title: 'Vehículo guardado', text: 'El vehículo ha sido guardado correctamente.', timer: 2000, showConfirmButton: false });
      } else {
        console.error('Error al guardar el vehículo');
      }
    }
    Object.assign(vehiculo.value, {
      tipo: "",
      matricula: "",
      marca: "",
      modelo: "",
      anio: "",
      estado: "disponible",
      kilometros: "",
      precio: "",
      combustible: "",
      transmision: "",
      potencia_cv: "",
      descripcion: "",
      ubicacion: {
        provincia: "",
        ciudad: ""
      },
      contacto: {
        nombre: "",
        telefono: "",
        email: ""
      },
      fecha_publicacion: ""
  });

  editando.value = false;
  articuloEditandoId.value = null;
  imagenFile.value = null;

  await cargarArticulos();

  } catch (error) {
    console.error("Error al guardar:", error);
  }
};

// manejar selección de archivo
const onFileChange = (event) => {
  const file = event.target.files && event.target.files[0];
  if (file) imagenFile.value = file;
  else imagenFile.value = null;
};

// cargar datos de un vehículo en el formulario para editar
const editarVehiculo = (item) => {
  // Mapear campos (compatibilidad con distintos backends)
  vehiculo.value = {
    tipo: item.tipo || '',
    matricula: item.matricula || '',
    marca: item.marca || '',
    modelo: item.modelo || '',
    anio: item.anio || '',
    estado: item.estado || 'disponible',
    kilometros: item.kilometros || '',
    precio: item.precio || '',
    combustible: item.combustible || '',
    transmision: item.transmision || '',
    potencia_cv: item.potencia_cv || '',
    descripcion: item.descripcion || '',
    ubicacion: item.ubicacion || { provincia: '', ciudad: '' },
    contacto: item.contacto || { nombre: '', telefono: '', email: '' },
    fecha_publicacion: item.fecha_publicacion || ''
  };
  editando.value = true;
  // intentar obtener id (mongo _id o json-server id)
  articuloEditandoId.value = item._id || item.id || null;
};
</script>