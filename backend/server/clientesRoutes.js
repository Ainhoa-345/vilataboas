import express from 'express';
import axios from 'axios';
import bcrypt from 'bcryptjs';

const router = express.Router();

// Base URL del json-server
const JSON_SERVER = 'http://localhost:3000/clientes';

// Crear cliente: hash de contraseña server-side y forward a json-server
router.post('/', async (req, res) => {
  try {
    const cliente = { ...req.body };

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

export default router;
