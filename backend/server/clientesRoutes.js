import express from 'express';
import axios from 'axios';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const router = express.Router();

// Base URL del json-server
const JSON_SERVER = 'http://localhost:3000/clientes';

// Helper: busca si existe un cliente con dni/email/movil (excluyendo un id opcional)
const existeDuplicado = async ({ dni, email, movil }, excludeId = null) => {
  try {
    // Consultar por cada campo si viene
    if (dni) {
      const r = await axios.get(`${JSON_SERVER}?dni=${encodeURIComponent(dni)}`);
      if (r.data && r.data.length > 0) {
        if (!excludeId || r.data.some(c => String(c.id) !== String(excludeId))) return { field: 'dni', item: r.data[0] };
      }
    }
    if (email) {
      const r = await axios.get(`${JSON_SERVER}?email=${encodeURIComponent(email)}`);
      if (r.data && r.data.length > 0) {
        if (!excludeId || r.data.some(c => String(c.id) !== String(excludeId))) return { field: 'email', item: r.data[0] };
      }
    }
    if (movil) {
      const r = await axios.get(`${JSON_SERVER}?movil=${encodeURIComponent(movil)}`);
      if (r.data && r.data.length > 0) {
        if (!excludeId || r.data.some(c => String(c.id) !== String(excludeId))) return { field: 'movil', item: r.data[0] };
      }
    }
    return null;
  } catch (e) {
    console.warn('Error comprobando duplicados en json-server:', e.message || e);
    return null; // en caso de error no bloquear operaciones por seguridad, pero idealmente loggear
  }
}

// Crear cliente: hash de contraseña server-side y forward a json-server
router.post('/', async (req, res) => {
  try {
    const cliente = { ...req.body };
    // Seguridad: no permitir que el cliente envíe/estabelezca su propio 'tipo'.
    // Siempre forzamos 'user' en registros públicos. Si se necesita crear
    // un admin deberá hacerse desde una ruta protegida por servidor/administrador.
    cliente.tipo = 'user';
    // comprobar duplicados: dni, email, movil
    const dup = await existeDuplicado({ dni: cliente.dni, email: cliente.email, movil: cliente.movil });
    if (dup) {
      return res.status(409).json({ message: `Duplicado en campo ${dup.field}`, field: dup.field });
    }

    if (cliente.password && cliente.password.trim() !== '') {
      // Hashear password recibida
      if (!cliente.password.startsWith('$2')) {
        cliente.password = bcrypt.hashSync(cliente.password, 10);
      }
    }

    const response = await axios.post(JSON_SERVER, cliente);
    res.status(response.status).json(response.data);
  } catch (error) {
    console.error('Error en POST /api/clientes', error.message || error);
    res.status(500).json({ message: 'Error creando cliente' });
  }
});

// Actualizar cliente: si password vacía -> conservar hash existente; si nueva -> hashear
router.put('/:id', async (req, res) => {
  const id = req.params.id;
  try {
    const incoming = { ...req.body };
    // comprobar duplicados (excluir el id actual)
    const dup = await existeDuplicado({ dni: incoming.dni, email: incoming.email, movil: incoming.movil }, id);
    if (dup) {
      return res.status(409).json({ message: `Duplicado en campo ${dup.field}`, field: dup.field });
    }

    // Obtener cliente actual para conservar password si viene vacío
    const existingRes = await axios.get(`${JSON_SERVER}/${id}`);
    const existing = existingRes.data || {};

    if (!incoming.password || incoming.password.trim() === '') {
      incoming.password = existing.password || '';
    } else {
      if (!incoming.password.startsWith('$2')) {
        incoming.password = bcrypt.hashSync(incoming.password, 10);
      }
    }

    // Seguridad: impedir escalado de privilegios. Mantener el 'tipo' existente
    // incluso si el cliente lo intenta modificar en la petición.
    incoming.tipo = existing.tipo || 'user';

    const response = await axios.put(`${JSON_SERVER}/${id}`, incoming);
    res.status(response.status).json(response.data);
  } catch (error) {
    console.error('Error en PUT /api/clientes/:id', error.message || error);
    res.status(500).json({ message: 'Error actualizando cliente' });
  }
});

// PATCH parcial (ej. para marcar historico=false)
router.patch('/:id', async (req, res) => {
  const id = req.params.id;
  try {
  // Evitar que el cliente parchee el campo 'tipo'. Obtener el existente y
  // aplicar el patch sin cambiar 'tipo'.
  const existingRes = await axios.get(`${JSON_SERVER}/${id}`);
  const existing = existingRes.data || {};
  const body = { ...req.body };
  body.tipo = existing.tipo || 'user';
  const response = await axios.patch(`${JSON_SERVER}/${id}`, body);
    res.status(response.status).json(response.data);
  } catch (error) {
    console.error('Error en PATCH /api/clientes/:id', error.message || error);
    res.status(500).json({ message: 'Error parcheando cliente' });
  }
});

// GET list (proxy a json-server) para facilitar llamadas desde frontend al backend
router.get('/', async (req, res) => {
  try {
    const query = req.originalUrl.split('?')[1] || '';
    const url = `${JSON_SERVER}${query ? '?' + query : ''}`;
    const response = await axios.get(url);
    res.json(response.data);
  } catch (error) {
    console.error('Error en GET /api/clientes', error.message || error);
    res.status(500).json({ message: 'Error obteniendo clientes' });
  }
});

// Obtener cliente por DNI (ej: /api/clientes/dni/15133821M)
router.get('/dni/:dni', async (req, res) => {
  try {
    const dni = req.params.dni;
    let response;
    try {
      response = await axios.get(`${JSON_SERVER}?dni=${encodeURIComponent(dni)}`);
    } catch (err) {
      console.error('Error consultando json-server en /dni/:dni:', err.message || err);
      return res.status(502).json({ message: 'Servicio de datos no disponible' });
    }
    const data = response.data || [];
    if (!data || data.length === 0) return res.status(404).json({ message: 'Cliente no encontrado' });
    res.json(data[0]);
  } catch (error) {
    console.error('Error en GET /api/clientes/dni/:dni', error.message || error);
    res.status(500).json({ message: 'Error obteniendo cliente por DNI' });
  }
});

// Obtener cliente logueado usando JWT en Authorization: Bearer <token>
router.get('/logueado', async (req, res) => {
  try {
    const auth = req.headers.authorization;
    if (!auth || !auth.startsWith('Bearer ')) return res.status(401).json({ message: 'No autorizado' });
    const token = auth.split(' ')[1];
    const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      console.warn('Token inválido en /logueado:', err.message || err);
      return res.status(401).json({ message: 'Token inválido' });
    }

    const dni = (decoded && decoded.dni) || req.query.dni || null;
    if (!dni) return res.status(400).json({ message: 'DNI no disponible en token' });

    let response;
    try {
      response = await axios.get(`${JSON_SERVER}?dni=${encodeURIComponent(dni)}`);
    } catch (err) {
      console.error('Error consultando json-server en /logueado:', err.message || err);
      return res.status(502).json({ message: 'Servicio de datos no disponible' });
    }
    const data = response.data || [];
    if (!data || data.length === 0) return res.status(404).json({ message: 'Cliente no encontrado' });
    res.json(data[0]);
  } catch (error) {
    console.error('Error en GET /api/clientes/logueado', error.message || error);
    res.status(500).json({ message: 'Error obteniendo cliente logueado' });
  }
});

// GET por id
router.get('/:id', async (req, res) => {
  try {
    const response = await axios.get(`${JSON_SERVER}/${req.params.id}`);
    res.json(response.data);
  } catch (error) {
    console.error('Error en GET /api/clientes/:id', error.message || error);
    res.status(500).json({ message: 'Error obteniendo cliente' });
  }
});

export default router;
