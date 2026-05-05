const axios = require('axios');
const express = require('express');
const router = express.Router();

const { isOwnerProfile } = require('../middleware');

const API_DADOS_URL = process.env.API_DADOS_URL || 'http://api_dados_server:16000/api';


// Rota default
router.get('/', function(req, res, next) {
  res.redirect('/users/perfil');
});

// GET perfil do utilizador atual
router.get('/perfil', function(req, res, next) {
  res.redirect(`/users/perfil/${res.locals.AUTH_ID}`);
});

// GET perfil de um utilizador específico
router.get('/perfil/:id', async function(req, res) {
  try {
    const currentID = res.locals.AUTH_ID;
    const userLevel = res.locals.AUTH_LEVEL || 0;
    const targetID = req.params.id;

    // Apenas pode ver os ficheiros privados se for o dono ou um admin
    let recursosUrl = `${API_DADOS_URL}/recursos?autor=${targetID}&_sort=data_registo&_order=desc`;
    if (Number(targetID) !== Number(currentID) && userLevel < 3) {
      recursosUrl += `&visibilidade=publico`;
    }

    const [userResp, recResp] = await Promise.all([
      axios.get(`${API_DADOS_URL}/users/${targetID}`),
      axios.get(recursosUrl)
    ]);
    
    const user = userResp.data;
    const recursos = recResp.data;
    
    res.render('profile', { 
      title: `${user.nome} ${user.apelido} | Perfil | Recursos LEI`, 
      user, 
      recursos, 
      contribuicoes: recursos.length,
    });
  } catch (err) {
    res.status(500).render('error', { message: 'Erro ao carregar perfil', error: err });
  }
});

// GET formulário para editar o perfil
router.get('/perfil/editar/:id', isOwnerProfile, async function(req, res) {
  try {
    const userResp = await axios.get(`${API_DADOS_URL}/users/${req.params.id}`);
    const user = userResp.data;
    res.render('editarPerfil', { title: 'Editar Perfil | Recursos LEI', user });
  } catch (err) {
    res.status(500).render('error', { message: 'Erro ao carregar edição de perfil', error: err });
  }
});

// POST atualizar perfil específico
router.post('/perfil/editar/:id', isOwnerProfile, async function(req, res) {
  try {
    const { nome, apelido, password_atual, password_nova } = req.body;
    
    const response = await axios.get(`${API_DADOS_URL}/users/${req.params.id}`);
    let user = response.data;
    
    user.nome = nome;
    user.apelido = apelido;

    if (password_atual && password_nova) {
      if (user.password === password_atual) {
        user.password = password_nova;
      } else {
        return res.status(400).render('editarPerfil', { title: 'Editar Perfil | Recursos LEI', user, error: 'A palavra-passe atual está incorreta.' });
      }
    }

    await axios.put(`${API_DADOS_URL}/users/${req.params.id}`, user);

    res.redirect(`/users/perfil/${req.params.id}`);
  } catch (err) {
    res.status(500).render('error', { message: 'Erro ao atualizar o perfil', error: err });
  }
});

module.exports = router;