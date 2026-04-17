const mongoose = require('mongoose');

const recursoSchema = new mongoose.Schema({
    id: { type: Number, required: true, unique: true },
    titulo: { type: String, required: true },
    ano: { type: String, required: true },
    tipo: { type: String, required: true },
    uc: { type: String, required: true },
    autor: { type: Number, required: true },
    data_registo: { type: Date, required: true },
    visibilidade: { type: String, enum: ['publico', 'privado'], required: true },
    tamanho_bytes: { type: Number, required: true },
    downloads: { type: Number, default: 0 },
    visualizacoes: { type: Number, default: 0 },
    media_avaliacoes: { type: Number, default: 0 },
    path: { type: String, required: true }
});

const Recurso = mongoose.model('Recurso', recursoSchema, 'recursos');

module.exports = Recurso;