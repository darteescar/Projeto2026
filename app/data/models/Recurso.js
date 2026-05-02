const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const recursoSchema = new mongoose.Schema({
    id: { type: Number, required: true, unique: true },
    titulo: { type: String, required: true },
    ano: { type: String, required: true },
    tipo: { type: String, required: true },
    uc: { type: String, required: true },
    autor: { type: Number, required: true },
    data_registo: { type: Date, required: true },
    visibilidade: { type: String, enum: ['publico', 'privado'], required: true },
    downloads: { type: Number, default: 0 },
    visualizacoes: { type: Number, default: 0 },
    media_avaliacoes: { type: Number, default: 0 },
    ficheiro: { type: Schema.Types.ObjectId, ref: 'File', required: true }
});

recursoSchema.index({titulo: 'text', uc: 'text'}) 

const Recurso = mongoose.model('Recurso', recursoSchema, 'recursos');

module.exports = Recurso;