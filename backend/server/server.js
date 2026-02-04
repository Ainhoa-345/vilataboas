import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// a diferencia de json-server, aquí necesita configurar las rutas y controladores manualmente
// json-server crea automáticamente las rutas basadas en el archivo JSON, mongoose requiere definir esquemas y modelos
// MONGOSEE NO SABE NADA DE RUTAS CONTROLADRES Y MODELOS, HAY QUE CREARLOS MANUALMENTE

import articulosRoutes from "./articulosRoutes.js"; // ruta al router backend
import authRouter from "./authRouter.js"; // ruta al router backend
import chatRoutes from "./chatRoutes.js";
import clientesRoutes from "./clientesRoutes.js";
import contactoRoutes from "./contactoRoutes.js";
import facturasRoutes from "./facturasRoutes.js";
import fs from 'fs'
import Factura from '../modelos/Factura.js'

dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;  // Use PORT from environment or default to 5000

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
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
                console.log(`Connected to MongoDB: ${sanitizedUri}`)
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