// Script para importar artículos de db.json a MongoDB
import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cargar variables de entorno
dotenv.config({ path: path.join(__dirname, '..', '..', '.env') });

const mongoUri = process.env.MONGO_URI || 'mongodb://admin:abc123@localhost:27017/bbdd?authSource=admin';

// Schema de Articulo
const articuloSchema = new mongoose.Schema({
  tipo: String,
  marca: String,
  modelo: String,
  anio: Number,
  kilometros: Number,
  precio: Number,
  combustible: String,
  transmision: String,
  color: String,
  puertas: Number,
  potencia_cv: Number,
  descripcion: String,
  ubicacion: {
    ciudad: String,
    provincia: String
  },
  imagen: String,
  contacto: {
    nombre: String,
    telefono: String,
    email: String
  },
  fecha_publicacion: Date,
  estado: String,
  matricula: String
}, { strict: false });

const Articulo = mongoose.model('Articulo', articuloSchema);

async function importar() {
  try {
    console.log('Conectando a MongoDB:', mongoUri);
    await mongoose.connect(mongoUri);
    console.log('Conectado a MongoDB');

    // Leer db.json
    const dbJsonPath = path.join(__dirname, '..', 'data', 'db.json');
    const dbContent = JSON.parse(fs.readFileSync(dbJsonPath, 'utf8'));
    
    if (!dbContent.articulos || dbContent.articulos.length === 0) {
      console.log('No hay artículos en db.json para importar');
      process.exit(0);
    }

    console.log(`Encontrados ${dbContent.articulos.length} artículos en db.json`);

    // Limpiar colección existente (opcional)
    const countBefore = await Articulo.countDocuments();
    console.log(`Artículos actuales en MongoDB: ${countBefore}`);

    // Preparar artículos para insertar
    const articulosParaInsertar = dbContent.articulos.map(art => {
      // Convertir formato $oid y $date si existen
      const articulo = { ...art };
      
      // Eliminar campos que pueden causar problemas
      delete articulo._id;
      delete articulo.id;
      
      // Convertir fecha si está en formato $date
      if (articulo.fecha_publicacion && articulo.fecha_publicacion.$date) {
        articulo.fecha_publicacion = new Date(articulo.fecha_publicacion.$date);
      }
      
      return articulo;
    });

    // Insertar en MongoDB
    const resultado = await Articulo.insertMany(articulosParaInsertar);
    console.log(`Insertados ${resultado.length} artículos en MongoDB`);

    const countAfter = await Articulo.countDocuments();
    console.log(`Total artículos en MongoDB ahora: ${countAfter}`);

    await mongoose.disconnect();
    console.log('Importación completada');
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

importar();
