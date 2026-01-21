import { ref } from "vue";
import axios from "axios";

const API_URL = "http://localhost:3000/taller";

// Estado inicial de la cita
export const nuevaCita = ref({
  id: null,
  matricula: "",
  movilCliente: "",
  fechaCita: "",
  servicioTaller: "",
  estadoCita: "pendiente",
  acepta: false
});

// VALIDACIONES
export const matriculaValida = ref(true);
export const movilValido = ref(true);
export const fechaValida = ref(true);

export const validarMatricula = () => {
  const regex = /^[0-9]{4}[BCDFGHJKLMNPRSTVWXYZ]{3}$/;
  matriculaValida.value = regex.test(
    nuevaCita.value.matricula.trim().toUpperCase()
  );
};

export const validarMovil = () => {
  const regex = /^[67]\d{8}$/;
  movilValido.value = regex.test(nuevaCita.value.movilCliente.trim());
};

export const validarFecha = () => {
  fechaValida.value = !!nuevaCita.value.fechaCita;
};

// CRUD
export const obtenerCitas = async () => {
  try {
    const res = await axios.get(API_URL);
    // Normalizar campos snake_case -> camelCase para el frontend
    return res.data.map(c => ({
      id: c.id,
      matricula: c.matricula || c.matricula,
      movilCliente: c.movilCliente || c.movil_cliente || c.movil || "",
      fechaCita: c.fechaCita || c.fecha_cita || c.fecha || "",
      servicioTaller: c.servicioTaller || c.servicio_taller || c.servicio || "",
      estadoCita: c.estadoCita || c.estado_cita || c.estado || "",
      acepta: c.acepta || false,
      // conservar campos extras
      _raw: c
    }));
  } catch (error) {
    console.error("Error al cargar citas:", error);
    return [];
  }
};

export const guardarCita = async () => {
  try {
    validarMatricula();
    validarMovil();
    validarFecha();

    if (!matriculaValida.value || !movilValido.value || !fechaValida.value) {
      alert("❌ Datos inválidos");
      return false;
    }

    // Convertir a snake_case para guardar en json-server
    const payload = {
      id: nuevaCita.value.id,
      matricula: nuevaCita.value.matricula,
      movil_cliente: nuevaCita.value.movilCliente,
      fecha_cita: nuevaCita.value.fechaCita,
      servicio_taller: nuevaCita.value.servicioTaller,
      estado_cita: nuevaCita.value.estadoCita,
      acepta: nuevaCita.value.acepta
    };

    if (nuevaCita.value.id) {
      // EDITAR
      await axios.put(`${API_URL}/${nuevaCita.value.id}`, payload);
    } else {
      // CREAR NUEVA
      const allCitas = await obtenerCitas();
      const nuevoId = allCitas.length
        ? Math.max(...allCitas.map(c => Number(c.id))) + 1
        : 1;
      payload.id = String(nuevoId);
      nuevaCita.value.id = String(nuevoId);

      await axios.post(API_URL, payload);
    }

    return true;
  } catch (error) {
    console.error("Error al guardar la cita:", error.response?.data || error.message);
    alert("❌ Error al guardar la cita");
    return false;
  }
};

export const eliminarCita = async (id) => {
  try {
    await axios.delete(`${API_URL}/${id}`);
  } catch (error) {
    console.error("Error al eliminar la cita:", error.response?.data || error.message);
    alert("❌ Error al eliminar la cita");
  }
};

export const limpiarCita = () => {
  nuevaCita.value = {
    id: null,
    matricula: "",
    movilCliente: "",
    fechaCita: "",
    servicioTaller: "",
    estadoCita: "pendiente",
    acepta: false
  };
};
