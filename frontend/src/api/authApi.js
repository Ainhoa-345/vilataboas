// authApi.js
import axios from "axios";

// Función que llama al backend para login usando JWT real
export const loginUsuario = async (dni, password) => {
  try {
    const response = await axios.post("http://localhost:5000/api/auth/login", {
      dni,
      password
    });
    return response.data; // { token, nombre, tipo }
  } catch (error) {
    // Log más detallado para debugging: si hay respuesta del servidor, incluir status y body
    if (error && error.response) {
      console.error("Error en loginUsuario: status=", error.response.status, "data=", error.response.data);
    } else {
      console.error("Error en loginUsuario:", error);
    }
    throw error;
  }
};

// Comprueba si el token guardado en sessionStorage corresponde a un admin.
// Devuelve un objeto con { isAdmin: boolean, name: string } y nunca lanza excepción
// para evitar que componentes que la llamen provoquen un fallo global.
export const checkAdmin = async () => {
  try {
    const token = sessionStorage.getItem('token');
    // Atajo DEV: si ejecutas localmente puedes establecer sessionStorage token = 'dev-admin'
    // para ser tratado como admin sin verificación del backend. Solo para desarrollo local.
    if (token === 'dev-admin') {
      return { isAdmin: true, name: 'Admin (dev)' };
    }
    if (!token) return { isAdmin: false, name: '' };

    const response = await axios.get("http://localhost:5000/api/auth/check-admin", {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    const data = response.data || {};
    // El backend puede devolver { tipo: 'admin', nombre: '...' } u otra forma.
    const name = data.nombre || data.name || '';
    const isAdmin = (data.tipo === 'admin') || (data.isAdmin === true);
    return { isAdmin, name };
  } catch (error) {
    console.error('Error en checkAdmin:', error);
    return { isAdmin: false, name: '' };
  }
};

// Compatibilidad: exportar registerUsuario si el componente lo importa
export const registerUsuario = async (payload) => {
  // intenta el endpoint más común; si falla prueba alternativa
  try {
    // Preferir crear cliente en el endpoint de clientes (backend proxy to json-server)
    const res = await axios.post("/api/clientes", payload);
    return res.data;
  } catch (err) {
    // Si la petición a /api/clientes devolvió un error de validación (400) o un
    // conflicto (409), relanzar para que el llamador pueda mostrar el mensaje
    // específico del campo. Solo intentar fallbacks cuando el endpoint no se
    // encontró (404) o hubo un error de red.
    if (err && err.response && err.response.status && err.response.status !== 404) {
      // relanzar errores de validación/conflicto/otros del servidor para que los maneje el llamador
      throw err;
    }

    // si falla crear en /api/clientes por 404 (ruta no encontrada) o error de red,
    // intentar rutas alternativas usadas por otros despliegues
    try {
      const res2 = await axios.post("/api/register", payload);
      return res2.data;
    } catch (err2) {
      // si tampoco existe /api/register, probar /api/auth/register y dejar que
      // cualquier error suba al llamador para mostrar mensajes adecuados.
      const res3 = await axios.post("/api/auth/register", payload);
      return res3.data;
    }
  }
};


//////////// PORQUE ESTE FICHERO Y NO LLAMAR DIRECTAMENTE A authController.js desde el frontend?

/* 
Este fichero actúa como intermediario entre el frontend (Vue) y el backend (Express).

1. Abstracción: Permite abstraer los detalles de la comunicación con el backend. Si la URL del backend cambia, solo hay que actualizarla aquí.

2. Manejo de Errores: Centraliza el manejo de errores relacionados con las peticiones HTTP.

3. Reutilización: Facilita la reutilización de funciones de API en diferentes componentes de Vue sin duplicar código.

4. Mantenimiento: Hace que el código sea más mantenible y organizado al separar las preocupaciones entre la lógica de la interfaz de usuario y la lógica de comunicación con el servidor.

5. Es un wrapper alrededor de axios para llamadas específicas a la API de autenticación.

6. Evita que el fronte tenga que conocer los detalles de las rutas del backend crypto o jwt.

7. El hash de la contraseña y la generación del JWT se hacen en el backend por seguridad, no en el frontend.
*/



/////////// EXPLICACION FLUJO LOGIN JWT REAL
/*

1. Usuario introduce DNI y contraseña en TablaClientes.vue.

2. Vue llama a loginUsuario() en api/authApi.js con esos datos y comprueba que no estén vacíos y existe el DNI.

3. loginUsuario() hace una petición POST a http://localhost:5000/api/auth/login.

4. Express recibe la petición en authRoutes.js y la envía al controlador authController.js YA ESTAMOS EN EL BACKEND

5. El controlador busca el usuario en la base de datos (JSON-server o MongoDB).

6. Compara la contraseña recibida en texto plano con el hash almacenado usando bcrypt.compare().

7. Si coincide, genera un JWT con jsonwebtoken y lo devuelve al frontend. 

8. JWT permite que el servidor reconozca al usuario sin volver a pedir la contraseña y asegura que la información del usuario no haya sido alterada durante la comunicación.

9. Vue recibe el token y los datos del usuario y los guarda en localStorage para sesiones futuras.

10. Si algo falla (usuario no existe, contraseña incorrecta, error del servidor), se lanza un error y Vue muestra un mensaje al usuario.
*/