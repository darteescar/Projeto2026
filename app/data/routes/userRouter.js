const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

// Novo user
router.post('/users', userController.createUser);

// Listar user com filtros
router.get('/users', userController.getAllUsers);

// Obter user por ID
router.get('/users/:id', userController.getUserById);

// Atualizar user por ID
router.put('/users/:id', userController.updateUser);

// Apagar user por ID
router.delete('/users/:id', userController.deleteUser);

module.exports = router;