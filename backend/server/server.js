import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// Determine __dirname early so dotenv can resolve the project root reliably
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// a diferencia de json-server, aquí necesita configurar las rutas y controladores manualmente
// json-server crea automáticamente las rutas basadas en el archivo JSON, mongoose requiere definir esquemas y modelos
// MONGOSEE NO SABE NADA DE RUTAS CONTROLADRES Y MODELOS, HAY QUE CREARLOS MANUALMENTE

import articulosRoutes from "./articulosRoutes.js"; // ruta al router backend
import authRouter from "./authRouter.js"; // ruta al router backend
import chatRoutes from "./chatRoutes.js";
import clientesRoutes from "./clientesRoutes.js";
import contactoRoutes from "./contactoRoutes.js";
import facturasRoutes from "./facturasRoutes.js";
// paymentsRoutes is imported after dotenv is configured (see below)
import fs from 'fs'
import Factura from '../modelos/Factura.js'
import Stripe from 'stripe'

// First load environment from default location, then try the project root .env
dotenv.config();
try {
    const rootEnv = path.resolve(__dirname, '..', '..', '.env')
    dotenv.config({ path: rootEnv })
    console.log('Loaded env from', rootEnv)
} catch (e) {
    console.warn('Could not load root .env explicitly:', e)
}
// Now dynamically import paymentsRoutes after environment variables are loaded
// Use dynamic import so the module is evaluated after dotenv has injected process.env
let paymentsRoutes
try {
    paymentsRoutes = (await import('./paymentsRoutes.js')).default
} catch (e) {
    console.error('Error importing paymentsRoutes:', e)
    paymentsRoutes = null
}
console.log('paymentsRoutes loaded:', !!paymentsRoutes)
try{
    console.log('paymentsRoutes type:', typeof paymentsRoutes, 'has stack len:', paymentsRoutes && paymentsRoutes.stack && paymentsRoutes.stack.length)
}catch(e){/* noop */}
const app = express();
const PORT = process.env.PORT || 5000;  // Use PORT from environment or default to 5000

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Middleware
app.use(cors({
    origin: "http://localhost:5173",
    credentials:true
})); // si no funciona lo siguiente

/* app.use(cors({
    origin: "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "DELETE"]
})); */

app.use(express.json());

// Direct payments endpoint in server.js as a fallback (ensures route exists)
const stripeKeyDirect = process.env.STRIPE_API_KEY
if (!stripeKeyDirect) console.warn('STRIPE_API_KEY not set in environment (direct handler)')
const stripeDirect = stripeKeyDirect ? new Stripe(stripeKeyDirect) : null

app.post('/api/payments/create-checkout-session', async (req, res) => {
    if (!stripeDirect) return res.status(500).json({ error: 'Stripe not configured' })
    try{
        const { amount, description } = req.body
        if (!amount || isNaN(Number(amount))) return res.status(400).json({ error: 'Invalid amount' })
        const amountCents = Math.round(Number(amount) * 100)
        const YOUR_DOMAIN = process.env.FRONTEND_ORIGIN || 'http://localhost:5173'
        const session = await stripeDirect.checkout.sessions.create({
            payment_method_types: ['card'],
            mode: 'payment',
            line_items: [{ price_data: { currency: 'eur', product_data: { name: description || 'Compra Vilataboas' }, unit_amount: amountCents }, quantity: 1 }],
            success_url: `${YOUR_DOMAIN}/factura?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${YOUR_DOMAIN}/cesta`,
        })
        return res.json({ url: session.url })
    }catch(e){
        console.error('Direct create-checkout-session error', e)
        return res.status(500).json({ error: 'No se pudo crear la sesión de pago' })
    }
})

// Rutas DE MONGOOSE, JSON SERVER NO ES NECESARIO LAS RUTAS LAS CREA AUTOMATICAMENTE
// json-server es un backend ya construido.
// Express es un backend que TÚ construyes.
// Por eso json-server no requiere rutas y Express sí.
app.use("/api/articulos", articulosRoutes);
app.use("/api/auth", authRouter);
app.use("/api/chat", chatRoutes);
app.use("/api/clientes", clientesRoutes);
app.use("/api/contacto", contactoRoutes);
app.use("/api/facturas", facturasRoutes);
app.use("/api/payments", paymentsRoutes);

// Debug: list mounted routes (for troubleshooting why /api/payments might 404)
try{
    const routes = app._router && app._router.stack
        ? app._router.stack
            .filter(l => l && l.route && l.route.path)
            .map(l => l.route.path)
        : []
    console.log('Mounted route paths:', routes)
}catch(e){ console.warn('Could not list routes:', e) }

// Temporary direct test endpoint to verify Express serves /api/payments/*
app.get('/api/payments/hello', (req, res) => res.json({ ok: true, from: 'server direct' }))

// Verificar variable
//console.log("MONGODB_URI =", process.env.MONGODB_URI);

/// Conexión a MongoDB: aceptar MONGODB_URI o MONGO_URI (ambos comúnmente usados), si no intentar la instancia local por defecto
const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/bbdd'

// utilidad mínima para enmascarar credenciales en logs (no revelar contraseñas en consola)
function maskMongoUri(uri){
    try{
        // ejemplo: mongodb://user:pass@host:27017/db?authSource=admin
        return uri.replace(/(mongodb:\/\/[^:]+:)([^@]+)(@)/, (_, p1, p2, p3) => p1 + '*****' + p3)
    }catch(e){
        return uri
    }
}

console.log('Mongo URI used:', maskMongoUri(mongoUri))

// sanitize URI: remove unsupported query params that cause MongoParseError (e.g. useNewUrlParser, useUnifiedTopology)
function sanitizeMongoUri(uri){
        try{
                let out = uri.replace(/([?&])(useNewUrlParser|useUnifiedTopology|useNewUrlparser)=([^&]*)/gi, '')
                // collapse any leftover ?& or trailing ?
                out = out.replace(/[?&]+$/, '')
                out = out.replace(/\?&/, '?')
                return out
        }catch(e){ return uri }
}

const sanitizedUri = sanitizeMongoUri(mongoUri)
if (sanitizedUri !== mongoUri) console.warn('Sanitized Mongo URI to remove unsupported options')

try{
        // attempt connection — wrap in try/catch to handle synchronous parse errors from the driver
        mongoose.connect(sanitizedUri, {
                serverSelectionTimeoutMS: 5000
        })
        .then(() => {
                console.log(`Connected to MongoDB: ${sanitizedUri}`);
                // al conectar, intentar vaciar el fichero de facturas pendientes si existe
                (async function flushPending(){
                    try{
                        const pendingPath = path.join(__dirname, '..', 'data', 'pending_facturas.json')
                        if (!fs.existsSync(pendingPath)) return
                        const raw = fs.readFileSync(pendingPath, 'utf8') || '[]'
                        const arr = JSON.parse(raw || '[]')
                        if (Array.isArray(arr) && arr.length > 0){
                            console.log('Flushing', arr.length, 'pending facturas to MongoDB')
                            await Factura.insertMany(arr)
                            fs.writeFileSync(pendingPath, '[]', 'utf8')
                            console.log('Pending facturas flushed to MongoDB')
                        }
                    }catch(e){
                        console.warn('Error flushing pending facturas:', e.message || e)
                    }
                })()
        })
        .catch((err) => {
                console.error('Initial connect to MongoDB failed:', err.message || err);
                console.error('Continuando sin DB. Intentaré reconectar en background cada 5s.');
        });
}catch(e){
        // captura errores sincrónicos (p. ej. MongoParseError durante parseOptions)
        console.error('Synchronous error while attempting to connect to MongoDB (continuando sin fallar):', e.message || e)
}

// Start the server regardless of initial DB state so routes that return 503 can work
app.listen(PORT, () => {
    console.log(`Server Express está corriendo en el puerto: ${PORT}`);
});

// Intento de reconexión periódica si no está conectado
const tryReconnect = () => {
    if (mongoose.connection.readyState === 1) return; // already connected
    console.log('Intentando reconectar a MongoDB...')
    mongoose.connect(mongoUri, {
        serverSelectionTimeoutMS: 5000
    }).then(() => {
        console.log('Reconnected to MongoDB')
    }).catch((err) => {
        console.warn('Reconnect failed:', err.message || err)
        // will try again by interval
    })
}

setInterval(tryReconnect, 5000)

// también, cuando Mongoose emita 'connected', intentar flush
mongoose.connection.on('connected', async () => {
    try{
        const pendingPath = path.join(__dirname, '..', 'data', 'pending_facturas.json')
        if (!fs.existsSync(pendingPath)) return
        const raw = fs.readFileSync(pendingPath, 'utf8') || '[]'
        const arr = JSON.parse(raw || '[]')
        if (Array.isArray(arr) && arr.length > 0){
            console.log('Detected DB reconnection — flushing', arr.length, 'pending facturas')
            await Factura.insertMany(arr)
            fs.writeFileSync(pendingPath, '[]', 'utf8')
            console.log('Flushed pending facturas after reconnection')
        }
    }catch(e){
        console.warn('Error flushing pending after connected event', e.message || e)
    }
})