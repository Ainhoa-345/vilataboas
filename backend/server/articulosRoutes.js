// server/articulosRoutes.js
import express from "express";
import multer from "multer";
import path from "path";
import mongoose from 'mongoose';
import Articulo from "../modelos/Articulo.js";
import { fileURLToPath } from "url";
import fs from 'fs';

// inicializar configuración de multer para manejo de archivos
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ruta al archivo db.json
const DB_JSON_PATH = path.join(__dirname, '..', 'data', 'db.json');

// Función auxiliar para sincronizar artículos de MongoDB a db.json
async function sincronizarConDbJson() {
    try {
        // Verificar que MongoDB esté conectado
        if (!mongoose.connection || mongoose.connection.readyState !== 1) {
            console.warn('MongoDB no conectado, no se puede sincronizar');
            return;
        }

        // Leer db.json actual
        const dbContent = JSON.parse(fs.readFileSync(DB_JSON_PATH, 'utf8'));
        
        // Obtener todos los artículos de MongoDB
        const articulosMongo = await Articulo.find().lean().exec();
        
        // Solo sincronizar si MongoDB tiene artículos
        if (articulosMongo.length === 0) {
            console.log('MongoDB no tiene artículos, no se sincroniza db.json');
            return;
        }
        
        // Actualizar la sección de artículos en db.json
        dbContent.articulos = articulosMongo.map(art => ({
            ...art,
            _id: art._id ? { $oid: art._id.toString() } : undefined,
            id: art.id || art._id?.toString()?.slice(-4) || Math.random().toString(36).slice(-4)
        }));
        
        // Escribir de vuelta a db.json
        fs.writeFileSync(DB_JSON_PATH, JSON.stringify(dbContent, null, 2), 'utf8');
        console.log('db.json sincronizado con MongoDB - articulos:', articulosMongo.length);
    } catch (err) {
        console.error('Error sincronizando db.json:', err.message);
    }
}

// Función para importar artículos de db.json a MongoDB (solo si MongoDB está vacío)
async function importarDesdeDbJson() {
    try {
        // Verificar que MongoDB esté conectado
        if (!mongoose.connection || mongoose.connection.readyState !== 1) {
            console.warn('MongoDB no conectado, no se puede importar');
            return;
        }

        // Verificar si MongoDB ya tiene artículos
        const countMongo = await Articulo.countDocuments();
        if (countMongo > 0) {
            console.log(`MongoDB ya tiene ${countMongo} artículos, no se importa desde db.json`);
            return;
        }

        // Leer db.json
        const dbContent = JSON.parse(fs.readFileSync(DB_JSON_PATH, 'utf8'));
        
        if (!dbContent.articulos || dbContent.articulos.length === 0) {
            console.log('db.json no tiene artículos para importar');
            return;
        }

        console.log(`Importando ${dbContent.articulos.length} artículos de db.json a MongoDB...`);
        
        // Preparar artículos para insertar
        const articulosParaInsertar = dbContent.articulos.map(art => {
            const articulo = { ...art };
            delete articulo._id;
            delete articulo.id;
            if (articulo.fecha_publicacion && articulo.fecha_publicacion.$date) {
                articulo.fecha_publicacion = new Date(articulo.fecha_publicacion.$date);
            }
            return articulo;
        });

        await Articulo.insertMany(articulosParaInsertar);
        console.log(`Importados ${articulosParaInsertar.length} artículos a MongoDB`);
    } catch (err) {
        console.error('Error importando desde db.json:', err.message);
    }
}

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
// Obtener todos los artículos desde MongoDB
router.get("/", async (req, res) => {
    try {
        // Verificar que MongoDB esté conectado
        if (!mongoose.connection || mongoose.connection.readyState !== 1) {
            return res.status(503).json({ error: 'Base de datos no disponible' });
        }
        const articulos = await Articulo.find().lean().exec();
        return res.json(articulos);
    } catch (err) {
        console.error('Error obteniendo articulos desde MongoDB:', err.message || err);
        return res.status(500).json({ error: 'No se pudo obtener articulos' });
    }
});

// Guardar artículo con imagen en MongoDB y sincronizar con db.json
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

        // Guardar en MongoDB
        const articulo = new Articulo(datos);
        const guardado = await articulo.save();
        
        // Sincronizar con db.json
        await sincronizarConDbJson();
        
        res.json(guardado);

    } catch (err) {
        console.error("Error guardando artículo:", err);
        res.status(500).json({ error: err.message });
    }
});

// Actualizar artículo y sincronizar
router.put("/:id", upload.single('imagen'), async (req, res) => {
    try {
        const { id } = req.params;
        let datos;
        
        if (req.body.vehiculo) {
            datos = JSON.parse(req.body.vehiculo);
        } else {
            datos = req.body;
        }

        if (req.file) {
            datos.imagen = `/uploads/${req.file.filename}`;
        }

        const actualizado = await Articulo.findByIdAndUpdate(id, datos, { new: true });
        
        if (!actualizado) {
            return res.status(404).json({ error: 'Artículo no encontrado' });
        }
        
        // Sincronizar con db.json
        await sincronizarConDbJson();
        
        res.json(actualizado);
    } catch (err) {
        console.error("Error actualizando artículo:", err);
        res.status(500).json({ error: err.message });
    }
});

// Eliminar artículo y sincronizar
router.delete("/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const eliminado = await Articulo.findByIdAndDelete(id);
        
        if (!eliminado) {
            return res.status(404).json({ error: 'Artículo no encontrado' });
        }
        
        // Sincronizar con db.json
        await sincronizarConDbJson();
        
        res.json({ message: 'Artículo eliminado', articulo: eliminado });
    } catch (err) {
        console.error("Error eliminando artículo:", err);
        res.status(500).json({ error: err.message });
    }
});

// Obtener artículo por ID
router.get("/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const articulo = await Articulo.findById(id).lean().exec();
        
        if (!articulo) {
            return res.status(404).json({ error: 'Artículo no encontrado' });
        }
        
        res.json(articulo);
    } catch (err) {
        console.error("Error obteniendo artículo:", err);
        res.status(500).json({ error: err.message });
    }
});

// Endpoint para forzar sincronización manual (MongoDB -> db.json)
router.post("/sync", async (req, res) => {
    try {
        await sincronizarConDbJson();
        const count = await Articulo.countDocuments();
        res.json({ message: 'Sincronización completada', articulos_en_mongo: count });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Endpoint para importar desde db.json a MongoDB
router.post("/import-from-json", async (req, res) => {
    try {
        await importarDesdeDbJson();
        const count = await Articulo.countDocuments();
        res.json({ message: 'Importación completada', articulos_en_mongo: count });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

export default router;