import express from 'express';
import axios from 'axios';
import bcrypt from 'bcryptjs';

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
    const response = await axios.patch(`${JSON_SERVER}/${id}`, req.body);
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
