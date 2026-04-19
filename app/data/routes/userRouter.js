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

router.post('/login_check', (req, res) => {
    userController.login(req.body.email, req.body.password)
        .then(user => res.jsonp(user))
        .catch(err => res.status(401).jsonp({ error: "Credenciais inválidas" }));
});

module.exports = router;