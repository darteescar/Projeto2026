var axios = require('axios');
var express = require('express');
var router = express.Router();

const API_DADOS_URL = process.env.API_DADOS_URL || 'http://api_dados_server:16000/api';

// GET página principal de admin (lista de todos users)
router.get('/', async function(req, res) {
    res.redirect('/admin/users');
});

router.get('/users', async function(req, res){
    try {
        const response = await axios.get(API_DADOS_URL + '/users?_sort=role,nome&_order=asc,asc');
        res.render('admin', { title: 'Administração | Recursos LEI', users: response.data });
    } catch(e) {
        res.render('error', { error: e, message: "Erro ao obter utilizadores" });
    }
});

// GET página edição de user (admin)
router.get('/users/editar/:id', async function(req, res){
    try {
        const response = await axios.get(API_DADOS_URL + '/users/' + req.params.id);
        res.render('editarUser', { title: 'Editar Utilizador | Recursos LEI', user: response.data });
    } catch(e) {
        res.render('error', { error: e, message: "Erro ao obter utilizador" });
    }
});

// POST atualização de user (admin)
router.post('/users/editar/:id', async function(req, res){
    try {
        const response = await axios.get(API_DADOS_URL + '/users/' + req.params.id);
        const userData = response.data;
        userData.role = req.body.role;
        
        await axios.put(API_DADOS_URL + '/users/' + req.params.id, userData);
        res.redirect('/admin/users');
    } catch(e) {
        res.render('error', { error: e, message: "Erro ao atualizar role do utilizador" });
    }
});

// POST apagar user (admin)
router.post('/users/delete/:id', async function(req, res){
    try {
        await axios.delete(API_DADOS_URL + '/users/' + req.params.id);
        res.redirect('/admin/users');
    } catch(e) {
        res.render('error', { error: e, message: "Erro ao apagar utilizador" });
    }
});

module.exports = router;