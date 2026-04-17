const mongoose = require('mongoose');

const comentarioSchema = new mongoose.Schema({
    id: { type: Number, required: true, unique: true },
    recurso_id: { type: Number, required: true },
    autor: { type: Number, required: true },
    avaliacao: { type: Number, required: true, min: 1, max: 5 },
    descricao: { type: String, required: true },
    data: { type: Date, required: true }
});

const Comentario = mongoose.model('Comentario', comentarioSchema, 'comentarios');

module.exports = Comentario;