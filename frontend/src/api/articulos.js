import axios from "axios";

// Usar el backend Express para artículos (dev: puerto 5000 -> /api/articulos).
// Antes se apuntaba a json-server raíz; eso devolvía todo el JSON y los artículos
// no tenían la misma forma (p.ej. imagen en /uploads). Apuntamos al router Express.
// Durante desarrollo preferir json-server (3000) para evitar depender de Express/Mongo.
const JSON_SERVER_URL = "http://localhost:3000/articulos";
const API_URL = JSON_SERVER_URL; // temporalmente apuntar a json-server para desarrollo


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

// ============================================== 
// FUNCIÓN PARA ACTUALIZAR EL STOCK DE UN ARTÍCULO
// ============================================== 
/**
 * updateStock: Actualiza el stock de un artículo
 * 
 * @param {string} id - ID del artículo a actualizar
 * @param {number} cantidad - Cantidad a restar del stock (normalmente 1 por compra)
 * @returns {Object} - El artículo actualizado
 * 
 * CÓMO FUNCIONA:
 * 1. Obtiene el artículo actual del servidor
 * 2. Calcula el nuevo stock restando la cantidad
 * 3. Actualiza el artículo con el nuevo stock
 * 4. Devuelve el artículo actualizado
 * 
 * EJEMPLO DE USO:
 * await updateStock('dec5', 1)  // Resta 1 unidad al artículo dec5
 */
export async function updateStock(id, cantidad = 1) {
  try {
    // 1. Obtener el artículo actual
    const articulo = await getArticuloById(id);
    
    // 2. Calcular el nuevo stock (no permitir negativos)
    const stockActual = articulo.stock ?? 0;
    const nuevoStock = Math.max(0, stockActual - cantidad);
    
    // 3. Actualizar el artículo con el nuevo stock
    // Usamos PATCH para actualizar solo el campo stock
    const res = await axios.patch(`${API_URL}/${id}`, { stock: nuevoStock });
    
    console.log(`Stock actualizado: ${articulo.marca} ${articulo.modelo} - ${stockActual} -> ${nuevoStock}`);
    
    return res.data;
  } catch (err) {
    console.error('Error actualizando stock:', err.message || err);
    throw err;
  }
}

/**
 * restarStockMultiple: Resta stock de múltiples artículos (para compras con varios items)
 * 
 * @param {Array} items - Array de objetos con {id, cantidad}
 * @returns {Array} - Array de artículos actualizados
 * 
 * EJEMPLO DE USO:
 * await restarStockMultiple([
 *   { id: 'dec5', cantidad: 1 },
 *   { id: 'dec6', cantidad: 2 }
 * ])
 */
export async function restarStockMultiple(items) {
  const resultados = [];
  for (const item of items) {
    try {
      const resultado = await updateStock(item.id, item.cantidad || 1);
      resultados.push(resultado);
    } catch (err) {
      console.error(`Error actualizando stock del artículo ${item.id}:`, err.message || err);
    }
  }
  return resultados;
}
// ==============================================

// Eliminar artículo
export async function deleteArticulo(id) {
  await axios.delete(`${API_URL}/${id}`);
}