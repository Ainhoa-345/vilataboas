import mongoose from 'mongoose';

const articuloSchema = new mongoose.Schema({
  titulo: { type: String, required: false },
  descripcion: { type: String, required: false },
  precio: { type: Number, required: false },
  imagen: { type: String, required: false },
  createdAt: { type: Date, default: Date.now }
});

const Articulo = mongoose.models.Articulo || mongoose.model('Articulo', articuloSchema);
export default Articulo;
