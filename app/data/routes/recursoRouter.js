const express = require('express')
const router = express.Router()
const recursoController = require('../controllers/recursoController')

// Novo recurso
router.post('/recursos', recursoController.createRecurso)

// Listar recursos com filtros
router.get('/recursos', recursoController.getAllRecursos)

// Obter recurso por ID
router.get('/recursos/:id', recursoController.getRecursoById)

// Atualizar recurso por ID
router.put('/recursos/:id', recursoController.updateRecurso)

// Apagar recurso por ID
router.delete('/recursos/:id', recursoController.deleteRecurso)

module.exports = router