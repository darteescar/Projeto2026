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