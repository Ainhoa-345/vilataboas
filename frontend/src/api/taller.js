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
    return res.data;
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

    if (nuevaCita.value.id) {
      // EDITAR
      await axios.put(`${API_URL}/${nuevaCita.value.id}`, nuevaCita.value);
    } else {
      // CREAR NUEVA
      const allCitas = await obtenerCitas();
      const nuevoId = allCitas.length
        ? Math.max(...allCitas.map(c => c.id)) + 1
        : 1;
      nuevaCita.value.id = nuevoId;

      await axios.post(API_URL, nuevaCita.value);
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
