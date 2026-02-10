import mongoose from 'mongoose';

const articuloSchema = new mongoose.Schema({
  tipo: { type: String, default: 'coche' },
  marca: { type: String, required: false },
  modelo: { type: String, required: false },
  anio: { type: Number, required: false },
  kilometros: { type: Number, required: false },
  precio: { type: Number, required: false },
  combustible: { type: String, required: false },
  transmision: { type: String, required: false },
  color: { type: String, required: false },
  puertas: { type: Number, required: false },
  potencia_cv: { type: Number, required: false },
  descripcion: { type: String, required: false },
  ubicacion: {
    ciudad: { type: String, required: false },
    provincia: { type: String, required: false }
  },
  imagen: { type: String, required: false },
  contacto: {
    nombre: { type: String, required: false },
    telefono: { type: String, required: false },
    email: { type: String, required: false }
  },
  fecha_publicacion: { type: Date, default: Date.now },
  estado: { type: String, default: 'disponible' },
  matricula: { type: String, required: false },
  // Campos legacy para compatibilidad
  titulo: { type: String, required: false },
  createdAt: { type: Date, default: Date.now }
}, { strict: false }); // strict: false permite campos adicionales no definidos

const Articulo = mongoose.models.Articulo || mongoose.model('Articulo', articuloSchema);
export default Articulo;
