import axios from 'axios';

// Endpoint para json-server (local). Ajusta si usas otro backend.
const API_URL = 'http://localhost:3000/contacto';

/**
 * enviarContacto
 * - form: { nombre, email, asunto, mensaje }
 * Devuelve { success: true, data } en caso OK, o { success: false, error } si falla.
 */
export const enviarContacto = async (form) => {
  try {
    const res = await axios.post(API_URL, form);
    return { success: true, data: res.data };
  } catch (error) {
    console.error('Error en enviarContacto:', error);
    return { success: false, error };
  }
};
