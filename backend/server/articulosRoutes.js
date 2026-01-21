// server/articulosRoutes.js
import express from "express";
import multer from "multer";
import path from "path";
import axios from 'axios';
import mongoose from 'mongoose';
import Articulo from "../modelos/Articulo.js";
import { fileURLToPath } from "url";
import fs from 'fs';

// inicializar configuración de multer para manejo de archivos
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Asegurarse de que la carpeta uploads exista
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir);
    console.log('Carpeta uploads creada automáticamente');
}

// Crear el router
const router = express.Router();
console.log("Router articulos cargado"); // para depurar



// Configuración de almacenamiento de multer en la carpeta uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, 'uploads')); // ruta absoluta a server/uploads
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

// Inicializar multer
const upload = multer({ storage: storage });

// AHORA VIENEN LAS RUTAS USANDO EL router DE EXPRESS
// Obtener todos los artículo
router.get("/", async (req, res) => {
    // Intentar obtener desde MongoDB pero con timeout corto;
    // si falla o tarda, hacer fallback a json-server (dev).
    const JSON_SERVER = 'http://localhost:3000/articulos';

    const mongoPromise = (async () => {
        try {
            // Si mongoose no está conectado, lanzar para forzar fallback rápido
            if (mongoose.connection && mongoose.connection.readyState !== 1) {
                throw new Error('MongoDB no conectado');
            }
            return await Articulo.find().lean().exec();
        } catch (e) {
            throw e;
        }
    })();

    // Timeout para fallback (ms)
    const TIMEOUT_MS = 1200;
    const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('mongo-timeout')), TIMEOUT_MS));

    try {
        const articulos = await Promise.race([mongoPromise, timeoutPromise]);
        return res.json(articulos);
    } catch (err) {
        console.warn('MongoDB ARTICULOS fallback:', err.message || err);
        try {
            const resp = await axios.get(JSON_SERVER, { timeout: 2000 });
            return res.json(resp.data);
        } catch (e) {
            console.error('Error fallback json-server articulos:', e.message || e);
            return res.status(500).json({ error: 'No se pudo obtener articulos' });
        }
    }
});

// Guardar artículo con imagen
router.post("/", upload.single('imagen'), async (req, res) => {
    try {
        if (!req.body.vehiculo) {
            console.error("No se recibió el campo 'vehiculo'");
            return res.status(400).json({ error: "Campo 'vehiculo' vacío" });
        }

        let datos;
        try {
            datos = JSON.parse(req.body.vehiculo);
        } catch (e) {
            console.error("Error parseando JSON:", e.message);
            return res.status(400).json({ error: "JSON inválido en 'vehiculo'", detalle: e.message });
        }

        if (req.file) {
            datos.imagen = `/uploads/${req.file.filename}`;
        }

        const articulo = new Articulo(datos);
        const guardado = await articulo.save();
        res.json(guardado);

    } catch (err) {
        console.error("Error guardando artículo:", err);
        res.status(500).json({ error: err.message, stack: err.stack });
    }
});


// otras rutas PUT, DELETE, GET /:id igual

export default router;