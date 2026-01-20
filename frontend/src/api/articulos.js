import axios from "axios";

// Usar el backend Express para artículos (dev: puerto 5000 -> /api/articulos).
// Antes se apuntaba a json-server raíz; eso devolvía todo el JSON y los artículos
// no tenían la misma forma (p.ej. imagen en /uploads). Apuntamos al router Express.
const API_URL = "http://localhost:5000/api/articulos";
const JSON_SERVER_URL = "http://localhost:3000/articulos";


// Obtener todos los artículos
export async function getArticulos() {
  try {
    const res = await axios.get(API_URL, { timeout: 3000 });
    return res.data;
  } catch (err) {
    // Fallback: si el backend Express no está disponible, intentar json-server
    console.warn('Backend articulos no disponible en 5000, intentando json-server en 3000:', err.message || err);
    const res = await axios.get(JSON_SERVER_URL);
    // json-server devuelve objetos con estructura ligeramente distinta; devolver tal cual
    return res.data;
  }
}

// Obtener artículo por ID
export async function getArticuloById(id) {
  const res = await axios.get(`${API_URL}/${id}`);
  return res.data;
}

// Crear artículo
export async function addArticulo(formData) {
  const res = await axios.post(API_URL, formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
  return res.data;
}

// Actualizar artículo
export async function updateArticulo(id, articulo) {
  const res = await axios.put(`${API_URL}/${id}`, articulo);
  return res.data;
}

// Eliminar artículo
export async function deleteArticulo(id) {
  await axios.delete(`${API_URL}/${id}`);
}