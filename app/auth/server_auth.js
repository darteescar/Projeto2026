 const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const axios = require('axios');
const jwt = require('jsonwebtoken');

const app = express();
const SECRET = "ENGWEB_PROJETO_2026";
const DATA_API = process.env.API_DADOS_URL || 'http://api_dados_server:16000/api';
const PORT = process.env.PORT || 16001;

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

// Rota de escolha (Ponto de entrada para não autenticados)
app.get('/', (req, res) => {
    res.render('index'); 
});

app.get('/login', (req, res) => res.render('login'));
app.get('/register', (req, res) => res.render('register'));

// Processar Registo
app.post('/register', (req, res) => {
    axios.post(`${DATA_API}/users`, req.body)
        .then(() => res.redirect('/login'))
        .catch(err => {
            console.error('Auth register error:', err.response ? err.response.data : err.message);
            res.render('register', {
                error: "Erro no registo. Verifique os dados e tente novamente.",
                formData: { nome: req.body.nome, apelido: req.body.apelido, email: req.body.email }
            });
        });
});

// Processar Login
app.post('/login', (req, res) => {
    axios.post(`${DATA_API}/login_check`, {
        email: req.body.email,
        password: req.body.password
    })
        .then(response => {
            const user = response.data;
            const token = jwt.sign(
                { email: user.email, role: user.role, nome: user.nome, apelido: user.apelido, id: user.id },
                SECRET, { expiresIn: '1d' }
            );
            res.cookie('token', token, { httpOnly: true });
            res.redirect('http://localhost:16002/'); // Redireciona para a Interface
        })
        .catch(() => res.render('login', { 
            error: "Credenciais inválidas!",
            formData: { email: req.body.email }
        }));
});

app.listen(PORT, () => console.log("Auth Service na porta 16001"));


/**
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
}); */
