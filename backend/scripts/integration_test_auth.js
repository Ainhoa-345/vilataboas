// Script de prueba de integración para el sistema de autenticación
// Uso: node integration_test_auth.js
// Este script crea un cliente de prueba, verifica que se guarda correctamente
// y comprueba que el login funciona con el cliente creado
import axios from 'axios';

// URL del servidor backend Express
const API = 'http://localhost:5000';
// URL del json-server (base de datos JSON)
const JSONS = 'http://localhost:3000';

async function main(){
  try{
    // Crear un DNI único para el test usando timestamp
    const dni = 'AUTOTEST' + Date.now().toString().slice(-6);
    const password = 'MiPass123!';
    
    // Datos del cliente de prueba
    const cliente = {
      dni,
      nombre: 'Auto',
      apellidos: 'Tester',
      email: `auto.${dni}@example.com`,
      movil: '600000000',
      direccion: 'Calle Test 1',
      provincia: 'Test',
      municipio: 'Test',
      fecha_alta: new Date().toISOString().slice(0,10),
      tipoCliente: 'particular',
      historico: false,
      lopd: true,
      password
    };

    console.log('Creando cliente...', dni);
    const createRes = await axios.post(`${API}/api/clientes`, cliente, { timeout: 5000 });
    console.log('Estado de respuesta de creación:', createRes.status);

    // Dar tiempo a json-server para procesar
    await new Promise(r => setTimeout(r, 500));

    // Verificar que el cliente se guardó en json-server
    const getRes = await axios.get(`${JSONS}/clientes`, { params: { dni }, timeout: 5000 });
    if(!Array.isArray(getRes.data) || getRes.data.length === 0){
      console.error('Cliente no encontrado en json-server');
      process.exit(1);
    }
    const stored = getRes.data[0];
    console.log('ID del cliente almacenado:', stored.id);
    console.log('Prefijo de contraseña almacenada:', stored.password && stored.password.slice(0,4));
    
    // Verificar que la contraseña está hasheada con bcrypt
    if(typeof stored.password !== 'string' || !stored.password.startsWith('$2')){
      console.error('La contraseña no está almacenada como hash bcrypt:', stored.password);
      process.exit(1);
    }

    // Intentar hacer login con el cliente creado
    console.log('Intentando login...');
    const loginRes = await axios.post(`${API}/api/auth/login`, { dni, password }, { timeout: 5000 });
    console.log('Estado del login:', loginRes.status);
    
    // Verificar que se recibió un token JWT
    if(loginRes.data && loginRes.data.token){
      console.log('Token recibido (truncado):', loginRes.data.token.slice(0,40) + '...');
      console.log('Test de integración: ÉXITO');
      process.exit(0);
    } else {
      console.error('El login no devolvió token:', loginRes.data);
      process.exit(1);
    }
  }catch(err){
    if(err.response){
      console.error('Error HTTP', err.response.status, err.response.data);
    } else {
      console.error('Error', err.message);
    }
    process.exit(1);
  }
}

main();
