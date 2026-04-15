var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Início | AppRecursos' });
});

/* GET pages */
router.get('/login', function(req, res, next) {
  res.render('login', { title: 'Login | AppRecursos' });
});

router.get('/registo', function(req, res, next) {
  res.render('register', { title: 'Registo | AppRecursos' });
});

router.get('/perfil', function(req, res, next) {
  res.render('profile', { title: 'Meu Perfil | AppRecursos' });
});

router.get('/perfil/:id', function(req, res, next) {
  res.render('profile', { title: 'Perfil de Utilizador | AppRecursos' });
});

router.get('/recursos', function(req, res, next) {
  res.render('recursos', { title: 'Catálogo de Recursos | AppRecursos', query: req.query });
});

router.get('/recursos/adicionar', function(req, res, next) {
  res.render('adicionarRecurso', { title: 'Adicionar Recurso | AppRecursos' });
});

router.get('/recursos/detalhes/:id', function(req, res, next) {
  res.render('detalhesRecurso', { title: 'Detalhes do Recurso | AppRecursos' });
});

router.get('/recursos/editar/:id', function(req, res, next) {
  res.render('editarRecurso', { title: 'Editar Recurso | AppRecursos' });
});

router.get('/recursos/download/:id', function(req, res, next) {
  // Placeholder para o downlaod
  res.redirect('/recursos');
});

router.post('/recursos/adicionar', function(req, res, next) {
  res.redirect('/recursos');
});

router.post('/recursos/editar/:id', function(req, res, next) {
  res.redirect('/recursos/detalhes/' + req.params.id);
});

router.post('/recursos/avaliar/:id', function(req, res, next) {
  res.redirect('/recursos/detalhes/' + req.params.id);
});

router.post('/recursos/delete/:id', function(req, res, next) {
  res.redirect('/recursos');
});

router.post('/login', function(req, res, next) {
  res.redirect('/perfil');
});

router.post('/registo', function(req, res, next) {
  res.redirect('/login');
});

router.get('/sobre', function(req, res, next) {
  res.render('sobre', { title: 'Sobre | AppRecursos' });
});

module.exports = router;
