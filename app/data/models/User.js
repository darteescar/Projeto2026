const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    id: { type: Number, required: true, unique: true },
    nome: { type: String, required: true },
    apelido: { type: String, required: true },
    data_criacao: { type: Date, required: true },
    role: { type: String, enum: ['admin', 'produtor', 'user'], required: true },
    password: { type: String, required: true },
    email: { type: String, required: true, unique: true }
});

const User = mongoose.model('User', userSchema, 'users');

module.exports = User;