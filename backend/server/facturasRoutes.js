import express from 'express';
import Factura from '../modelos/Factura.js';
import fs from 'fs'
import path from 'path'
import mongoose from 'mongoose'
import http from 'http'

const router = express.Router();

// Obtener todas las facturas
router.get('/', async (req, res) => {
  try {
    const facturas = await Factura.find({ estado: { $ne: 'eliminado' } }).sort({ fecha: -1 });
    res.json(facturas);
  } catch (error) {
    console.error('Error al obtener facturas:', error);
    res.status(500).json({ 
      error: 'Error al obtener facturas',
      details: error.message 
    });
  }
});

// Obtener una factura por ID
router.get('/:id', async (req, res) => {
  try {
    const factura = await Factura.findById(req.params.id);
    
    if (!factura) {
      return res.status(404).json({ error: 'Factura no encontrada' });
    }
    
    res.json(factura);
  } catch (error) {
    console.error('Error al obtener factura:', error);
    res.status(500).json({ 
      error: 'Error al obtener factura',
      details: error.message 
    });
  }
});

// Obtener HTML de factura para imprimir
router.get('/imprimir/:id', async (req, res) => {
  try {
    const factura = await Factura.findById(req.params.id);
    
    if (!factura) {
      return res.status(404).json({ error: 'Factura no encontrada' });
    }
    
    res.json(factura);
  } catch (error) {
    console.error('Error al obtener factura para imprimir:', error);
    res.status(500).json({ 
      error: 'Error al obtener factura',
      details: error.message 
    });
  }
});

// Obtener facturas por email de cliente
router.get('/cliente/:email', async (req, res) => {
  try {
    const facturas = await Factura.find({ 
      'cliente.email': req.params.email,
      estado: { $ne: 'eliminado' }
    }).sort({ fecha: -1 });
    
    res.json(facturas);
  } catch (error) {
    console.error('Error al obtener facturas del cliente:', error);
    res.status(500).json({ 
      error: 'Error al obtener facturas del cliente',
      details: error.message 
    });
  }
});

// Obtener facturas por DNI de cliente
router.get('/cliente/dni/:dni', async (req, res) => {
  try {
    const facturas = await Factura.find({ 
      'cliente.dni': req.params.dni,
      estado: { $ne: 'eliminado' }
    }).sort({ fecha: -1 });
    
    res.json(facturas);
  } catch (error) {
    console.error('Error al obtener facturas del cliente por DNI:', error);
    res.status(500).json({ 
      error: 'Error al obtener facturas del cliente por DNI',
      details: error.message 
    });
  }
});

// Eliminar factura (eliminación lógica)
router.patch('/:id/eliminar', async (req, res) => {
  try {
    const factura = await Factura.findByIdAndUpdate(
      req.params.id,
      { estado: 'eliminado' },
      { new: true }
    );
    
    if (!factura) {
      return res.status(404).json({ error: 'Factura no encontrada' });
    }
    
    res.json({ message: 'Factura marcada como eliminada', factura });
  } catch (error) {
    console.error('Error al eliminar factura:', error);
    res.status(500).json({ 
      error: 'Error al eliminar factura',
      details: error.message 
    });
  }
});

// ------------ Helper: pending file for offline persistence ------------
const PENDING_FILE = path.join(path.dirname(new URL(import.meta.url).pathname), '..', 'data', 'pending_facturas.json')

function ensurePendingFile(){
  try{
    const dir = path.dirname(PENDING_FILE)
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
    if (!fs.existsSync(PENDING_FILE)) fs.writeFileSync(PENDING_FILE, '[]', 'utf8')
  }catch(e){ console.warn('Could not ensure pending file', e) }
}

// POST: crear una factura (resiliente: intenta MongoDB, luego json-server, luego disco)
router.post('/', async (req, res) => {
  try{
    const incoming = req.body || {}

    // Transformar payload al esquema esperado por Factura.js
    const items = (incoming.items || []).map(it => {
      const precio = Number(it.precio || 0)
      const cantidad = Number(it.cantidad || 1)
      return {
        productoId: (it.id || it._id || null) ? String(it.id || it._id || '') : null,
        nombre: it.modelo || it.nombre || it.modelo || 'Artículo',
        precio: precio,
        cantidad: cantidad,
        total: Math.round((precio * cantidad) * 100) / 100,
        matricula: it.matricula || ''
      }
    })

    const totalFactura = Number(incoming.total || items.reduce((s,i)=> s + (i.total||0), 0))

    // mapear metodoPago a los aceptados por el modelo (paypal|stripe)
    let metodoPago = 'paypal'
    const mp = (incoming.metodoPago || '').toString().toLowerCase()
    if (mp.includes('stripe') || mp.includes('card') || mp.includes('tarjeta')) metodoPago = 'stripe'
    if (mp.includes('paypal') || mp.includes('pay')) metodoPago = 'paypal'

    const doc = {
      items,
      totalFactura,
      fecha: incoming.fecha ? new Date(incoming.fecha) : new Date(),
      metodoPago,
      estadoPago: incoming.estadoPago || 'completado',
      estado: incoming.estado || 'activo',
      transaccionId: incoming.transaccionId || ('tx_' + Date.now()),
      cliente: {
        email: incoming.cliente?.email || (incoming.clienteEmail || ''),
        nombre: incoming.cliente?.nombre || incoming.cliente?.nombreCompleto || '',
        dni: incoming.cliente?.dni || incoming.cliente?.nif || ''
      }
    }

    // Si Mongo está conectado, guardar ahí
    if (mongoose.connection && mongoose.connection.readyState === 1){
      const created = await Factura.create(doc)
      console.info('Factura saved to MongoDB', { id: created._id?.toString?.(), transaccionId: created.transaccionId })
      return res.status(201).json({ status: 'saved_db', location: 'db', id: created._id, transaccionId: created.transaccionId, factura: created })
    }

    // Si no hay Mongo, intentar enviar a json-server (http://localhost:3000/facturas)
    try{
      const jsonServerUrl = 'http://localhost:3000/facturas'
      const body = JSON.stringify(doc)
      const parsed = new URL(jsonServerUrl)
      const opts = {
        hostname: parsed.hostname,
        port: parsed.port || 80,
        path: parsed.pathname,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(body)
        }
      }

      const forwardedResp = await new Promise((resolve, reject) => {
        const r = http.request(opts, (resp) => {
          let data = ''
          resp.setEncoding('utf8')
          resp.on('data', c => data += c)
          resp.on('end', () => {
            if (resp.statusCode >= 200 && resp.statusCode < 300) return resolve({ statusCode: resp.statusCode, body: data })
            const err = new Error('json-server status ' + resp.statusCode)
            err.status = resp.statusCode
            err.body = data
            return reject(err)
          })
        })
        r.on('error', reject)
        r.write(body)
        r.end()
      })

      let parsedBody = forwardedResp.body
      try{ parsedBody = JSON.parse(forwardedResp.body) }catch(e){ /* keep raw */ }
      console.info('Factura forwarded to json-server', { statusCode: forwardedResp.statusCode, transaccionId: doc.transaccionId })
      return res.status(201).json({ status: 'saved_jsonserver', location: 'json-server', transaccionId: doc.transaccionId, forwardedStatus: forwardedResp.statusCode, forwardedBody: parsedBody })
    }catch(e){
      // si falla, guardar en disco (pending file)
      ensurePendingFile()
      try{
        const raw = fs.readFileSync(PENDING_FILE, 'utf8') || '[]'
        const arr = JSON.parse(raw || '[]')
        arr.push(doc)
        fs.writeFileSync(PENDING_FILE, JSON.stringify(arr, null, 2), 'utf8')
        console.warn('Saved factura to pending file (no DB/json-server)', doc.transaccionId)
        return res.status(202).json({ status: 'saved_local', location: 'local-file', transaccionId: doc.transaccionId, pendingFile: PENDING_FILE, pendingCount: arr.length, message: 'Guardada localmente; se reintentará más tarde' })
      }catch(err){
        console.error('Failed to write pending file', err)
        return res.status(500).json({ error: 'No se pudo guardar la factura', details: err.message || err })
      }
    }

  }catch(error){
    console.error('Error in POST /api/facturas:', error && (error.stack || error))
    // devolver detalles para debugging en dev
    res.status(500).json({ error: error.message || 'Error guardando factura', details: error.stack || error })
  }
})

export default router;
