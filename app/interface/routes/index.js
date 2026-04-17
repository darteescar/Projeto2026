var axios = require('axios');
var express = require('express');
var router = express.Router();

const API_DADOS_URL = process.env.API_DADOS_URL || 'http://localhost:16002';

// GET página principal
router.get('/', async function(req, res) {
  try{
    const response = await axios.get(`${API_DADOS_URL}/recursos`);
    const recursos = response.data;

    // Arrays para os recentes e top10
    const recentes = [...recursos].sort((a,b) => new Date(b.data_registo) - new Date(a.data_registo)).slice(0, 10);
    const top10 = [...recursos].sort((a,b) => (b.visualizacoes || 0) - (a.visualizacoes || 0)).slice(0, 10);

    res.render('index', { title: 'Início | Recursos LEI', recentes, top10 });
  }catch(error){
    res.status(500).render('index', { title: 'Início | Recursos LEI', recentes: [], top10: [] });
  }
});

// GET página sobre
router.get('/sobre', function(req, res) {
  res.render('sobre', { title: 'Sobre | Recursos LEI' });
});

// GET perfil do utilizador atual
router.get('/perfil', function(req, res, next) {
  // TODO: depois com os users is buscar a informação direita
  res.render('profile', { title: 'O Meu Perfil | Recursos LEI' });
});

// GET perfil de um utilizador específico
router.get('/perfil/:id', function(req, res, next) {
  // TODO: meter o titulo do perfil como o nome do utilizador
  res.render('profile', { title: 'Perfil de Utilizador | Recursos LEI' });
});









// ========================================================
// TODO: estas rotas depois devem ir para a autenticação
// ========================================================
router.get('/login', function(req, res, next) {
  res.render('login', { title: 'Login | Recursos LEI' });
});

router.get('/registo', function(req, res, next) {
  res.render('register', { title: 'Registo | Recursos LEI' });
});

router.post('/login', function(req, res, next) {
  res.redirect('/');
});

router.post('/registo', function(req, res, next) {
  res.redirect('/login');
});

module.exports = router;
