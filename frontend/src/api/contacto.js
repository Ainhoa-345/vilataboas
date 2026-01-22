import axios from 'axios';

// Endpoint configurable: usa VITE_API_BASE o por defecto el backend Express en 5000
const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000';
const API_URL = `${API_BASE}/api/contacto`;

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
