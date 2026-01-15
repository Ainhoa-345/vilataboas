import express from 'express';
import axios from 'axios';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const router = express.Router();

// Base URL del json-server
const JSON_SERVER = 'http://localhost:3000/clientes';

// Crear cliente: hash de contraseña server-side y forward a json-server
router.post('/', async (req, res) => {
  try {
    const cliente = { ...req.body };

    // === Validaciones de unicidad server-side ===
    // Comprobar DNI
    if (cliente.dni) {
      const exists = await axios.get(`${JSON_SERVER}?dni=${encodeURIComponent(cliente.dni)}`);
      if (exists.data && exists.data.length > 0) {
        return res.status(400).json({ message: 'Ya existe un cliente con ese DNI' });
      }
    }

    // Comprobar email (si viene)
    if (cliente.email) {
      const existsEmail = await axios.get(`${JSON_SERVER}?email=${encodeURIComponent(cliente.email)}`);
      if (existsEmail.data && existsEmail.data.length > 0) {
        return res.status(400).json({ message: 'Ya existe un cliente con ese email' });
      }
    }

    // Comprobar móvil (si viene)
    if (cliente.movil) {
      const existsMovil = await axios.get(`${JSON_SERVER}?movil=${encodeURIComponent(cliente.movil)}`);
      if (existsMovil.data && existsMovil.data.length > 0) {
        return res.status(400).json({ message: 'Ya existe un cliente con ese móvil' });
      }
    }

    // Hashear password recibida (si viene)
    if (cliente.password && cliente.password.trim() !== '') {
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

    // === Validaciones de unicidad (excluir el propio registro) ===
    const dniToCheck = incoming.dni || existing.dni || '';
    if (dniToCheck) {
      const byDni = await axios.get(`${JSON_SERVER}?dni=${encodeURIComponent(dniToCheck)}`);
      if (byDni.data && byDni.data.some((c) => c.id !== id)) {
        return res.status(400).json({ message: 'Otro cliente ya tiene ese DNI' });
      }
    }

    if (incoming.email) {
      const byEmail = await axios.get(`${JSON_SERVER}?email=${encodeURIComponent(incoming.email)}`);
      if (byEmail.data && byEmail.data.some((c) => c.id !== id)) {
        return res.status(400).json({ message: 'Otro cliente ya tiene ese email' });
      }
    }

    if (incoming.movil) {
      const byMovil = await axios.get(`${JSON_SERVER}?movil=${encodeURIComponent(incoming.movil)}`);
      if (byMovil.data && byMovil.data.some((c) => c.id !== id)) {
        return res.status(400).json({ message: 'Otro cliente ya tiene ese móvil' });
      }
    }

    // === Política: evitar que un admin cambie la contraseña de otro usuario ===
    const auth = req.headers.authorization;
    const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';
    let decoded = null;
    if (auth && auth.startsWith('Bearer ')) {
      const token = auth.split(' ')[1];
      try {
        decoded = jwt.verify(token, JWT_SECRET);
      } catch (err) {
        // token inválido -> decoded queda null (no bloqueamos otras operaciones por token inválido)
        decoded = null;
      }
    }

    // Si viene nueva contraseña y actor autenticado es admin y está editando a otro -> prohibir
    if (incoming.password && incoming.password.trim() !== '') {
      const actorTipo = decoded && decoded.tipo ? decoded.tipo : null;
      const actorDni = decoded && decoded.dni ? decoded.dni : null;
      const targetDni = incoming.dni || existing.dni || '';

      if (actorTipo === 'admin' && actorDni && targetDni && actorDni !== targetDni) {
        return res.status(403).json({ message: 'Los administradores no pueden cambiar la contraseña de otros usuarios' });
      }

      // Si pasa la política, hashear la nueva contraseña si no viene ya hasheada
      if (!incoming.password.startsWith('$2')) {
        incoming.password = bcrypt.hashSync(incoming.password, 10);
      }
    } else {
      // No se envió nueva password -> conservar la existente
      incoming.password = existing.password || '';
    }

    const response = await axios.put(`${JSON_SERVER}/${id}`, incoming);
    res.status(response.status).json(response.data);
  } catch (error) {
    console.error('Error en PUT /api/clientes/:id', error.message || error);
    res.status(500).json({ message: 'Error actualizando cliente' });
  }
});

export default router;
