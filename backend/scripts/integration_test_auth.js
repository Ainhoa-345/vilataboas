import axios from 'axios';

const API = 'http://localhost:5000';
const JSONS = 'http://localhost:3000';

async function main(){
  try{
    const dni = 'AUTOTEST' + Date.now().toString().slice(-6);
    const password = 'MiPass123!';
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

    console.log('Creating cliente...', dni);
    const createRes = await axios.post(`${API}/api/clientes`, cliente, { timeout: 5000 });
    console.log('Create response status:', createRes.status);

    // give json-server a moment
    await new Promise(r => setTimeout(r, 500));

    const getRes = await axios.get(`${JSONS}/clientes`, { params: { dni }, timeout: 5000 });
    if(!Array.isArray(getRes.data) || getRes.data.length === 0){
      console.error('Cliente not found in json-server');
      process.exit(1);
    }
    const stored = getRes.data[0];
    console.log('Stored cliente id:', stored.id);
    console.log('Stored password prefix:', stored.password && stored.password.slice(0,4));
    if(typeof stored.password !== 'string' || !stored.password.startsWith('$2')){
      console.error('Password not stored as bcrypt hash:', stored.password);
      process.exit(1);
    }

    // try login
    console.log('Attempting login...');
    const loginRes = await axios.post(`${API}/api/auth/login`, { dni, password }, { timeout: 5000 });
    console.log('Login status:', loginRes.status);
    if(loginRes.data && loginRes.data.token){
      console.log('Received token (truncated):', loginRes.data.token.slice(0,40) + '...');
      console.log('Integration test: SUCCESS');
      process.exit(0);
    } else {
      console.error('Login did not return token:', loginRes.data);
      process.exit(1);
    }
  }catch(err){
    if(err.response){
      console.error('HTTP error', err.response.status, err.response.data);
    } else {
      console.error('Error', err.message);
    }
    process.exit(1);
  }
}

main();
