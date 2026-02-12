import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// Determinar __dirname temprano para que dotenv pueda resolver la raíz del proyecto de forma fiable
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// a diferencia de json-server, aquí necesita configurar las rutas y controladores manualmente
// json-server crea automáticamente las rutas basadas en el archivo JSON, mongoose requiere definir esquemas y modelos
// MONGOOSE NO SABE NADA DE RUTAS CONTROLADORES Y MODELOS, HAY QUE CREARLOS MANUALMENTE

import articulosRoutes from "./articulosRoutes.js"; // ruta al router backend
import authRouter from "./authRouter.js"; // ruta al router backend
import chatRoutes from "./chatRoutes.js";
import clientesRoutes from "./clientesRoutes.js";
import contactoRoutes from "./contactoRoutes.js";
import facturasRoutes from "./facturasRoutes.js";
// paymentsRoutes se importa después de configurar dotenv (ver abajo)
import fs from 'fs'
import Factura from '../modelos/Factura.js'
import Stripe from 'stripe'

// Primero cargar variables de entorno desde la ubicación por defecto, luego intentar el .env de la raíz del proyecto
dotenv.config();
try {
    const rootEnv = path.resolve(__dirname, '..', '..', '.env')
    dotenv.config({ path: rootEnv })
    console.log('Variables de entorno cargadas desde', rootEnv)
} catch (e) {
    console.warn('No se pudo cargar el .env de la raíz explícitamente:', e)
}
// Ahora importar dinámicamente paymentsRoutes después de que las variables de entorno estén cargadas
// Usar import dinámico para que el módulo se evalúe después de que dotenv haya inyectado process.env
let paymentsRoutes
try {
    paymentsRoutes = (await import('./paymentsRoutes.js')).default
} catch (e) {
    console.error('Error importando paymentsRoutes:', e)
    paymentsRoutes = null
}
console.log('paymentsRoutes cargado:', !!paymentsRoutes)
try{
    console.log('paymentsRoutes tipo:', typeof paymentsRoutes, 'tiene stack len:', paymentsRoutes && paymentsRoutes.stack && paymentsRoutes.stack.length)
}catch(e){/* ignorar */}
const app = express();
const PORT = process.env.PORT || 5000;  // Usar PORT desde las variables de entorno o por defecto 5000

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

// Endpoint directo de pagos en server.js como respaldo (asegura que la ruta existe)
const stripeKeyDirect = process.env.STRIPE_API_KEY
if (!stripeKeyDirect) console.warn('STRIPE_API_KEY no está configurada en las variables de entorno (handler directo)')
const stripeDirect = stripeKeyDirect ? new Stripe(stripeKeyDirect) : null

app.post('/api/payments/create-checkout-session', async (req, res) => {
    if (!stripeDirect) return res.status(500).json({ error: 'Stripe no está configurado' })
    try{
        const { amount, description } = req.body
        if (!amount || isNaN(Number(amount))) return res.status(400).json({ error: 'Monto inválido' })
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
        console.error('Error directo en create-checkout-session', e)
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

// Debug: listar rutas montadas (para depurar por qué /api/payments podría dar 404)
try{
    const routes = app._router && app._router.stack
        ? app._router.stack
            .filter(l => l && l.route && l.route.path)
            .map(l => l.route.path)
        : []
    console.log('Rutas montadas:', routes)
}catch(e){ console.warn('No se pudieron listar las rutas:', e) }

// Endpoint temporal de prueba para verificar que Express sirve /api/payments/*
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

console.log('URI de Mongo utilizada:', maskMongoUri(mongoUri))

// sanitizar URI: eliminar parámetros de consulta no soportados que causan MongoParseError (ej. useNewUrlParser, useUnifiedTopology)
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
if (sanitizedUri !== mongoUri) console.warn('Se ha sanitizado la URI de Mongo para eliminar opciones no soportadas')

try{
        // intentar conexión — envolver en try/catch para manejar errores de parsing sincrónicos del driver
        mongoose.connect(sanitizedUri, {
                serverSelectionTimeoutMS: 5000
        })
        .then(() => {
                console.log(`Conectado a MongoDB: ${sanitizedUri}`);
                // al conectar, intentar vaciar el fichero de facturas pendientes si existe
                (async function flushPending(){
                    try{
                        const pendingPath = path.join(__dirname, '..', 'data', 'pending_facturas.json')
                        if (!fs.existsSync(pendingPath)) return
                        const raw = fs.readFileSync(pendingPath, 'utf8') || '[]'
                        const arr = JSON.parse(raw || '[]')
                        if (Array.isArray(arr) && arr.length > 0){
                            console.log('Vaciando', arr.length, 'facturas pendientes a MongoDB')
                            await Factura.insertMany(arr)
                            fs.writeFileSync(pendingPath, '[]', 'utf8')
                            console.log('Facturas pendientes vaciadas a MongoDB')
                        }
                    }catch(e){
                        console.warn('Error al vaciar facturas pendientes:', e.message || e)
                    }
                })()
        })
        .catch((err) => {
                console.error('Fallo en conexión inicial a MongoDB:', err.message || err);
                console.error('Continuando sin DB. Intentaré reconectar en background cada 5s.');
        });
}catch(e){
        // captura errores sincrónicos (p. ej. MongoParseError durante parseOptions)
        console.error('Error sincrónico al intentar conectar a MongoDB (continuando sin fallar):', e.message || e)
}

// Iniciar el servidor independientemente del estado inicial de la BD para que las rutas que devuelven 503 puedan funcionar
app.listen(PORT, () => {
    console.log(`Server Express está corriendo en el puerto: ${PORT}`);
});

// Intento de reconexión periódica si no está conectado
const tryReconnect = () => {
    if (mongoose.connection.readyState === 1) return; // ya conectado
    console.log('Intentando reconectar a MongoDB...')
    mongoose.connect(mongoUri, {
        serverSelectionTimeoutMS: 5000
    }).then(() => {
        console.log('Reconectado a MongoDB')
    }).catch((err) => {
        console.warn('Fallo en reconexión:', err.message || err)
        // reintentará por intervalo
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
            console.log('Detectada reconexión a BD — vaciando', arr.length, 'facturas pendientes')
            await Factura.insertMany(arr)
            fs.writeFileSync(pendingPath, '[]', 'utf8')
            console.log('Facturas pendientes vaciadas tras reconexión')
        }
    }catch(e){
        console.warn('Error al vaciar pendientes tras evento connected', e.message || e)
    }
})