import axios from "axios";

// En entorno de desarrollo sin MongoDB el backend de artículos no está disponible
// y usamos json-server (puerto 3000). Si despliegas con MongoDB/Express, cambia a 5000.
const API_URL = "http://localhost:3000";


// Obtener todos los artículos
export async function getArticulos() {
  const res = await axios.get(API_URL);
  return res.data;
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