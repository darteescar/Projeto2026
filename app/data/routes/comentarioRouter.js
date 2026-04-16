const express = require('express');
const router = express.Router();
const comentarioController = require('../controllers/comentarioController');

// Novo comentário
router.post('/comentarios', comentarioController.createComentario);

// Listar comentários com filtros
router.get('/comentarios', comentarioController.getAllComentarios);

// Obter comentário por ID
router.get('/comentarios/:id', comentarioController.getComentarioById);

// Atualizar comentário por ID
router.put('/comentarios/:id', comentarioController.updateComentario);

// Deletar comentário por ID
router.delete('/comentarios/:id', comentarioController.deleteComentario);

module.exports = router;