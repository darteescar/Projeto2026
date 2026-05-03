const express = require('express');
const path = require('path');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const cors = require('cors');

const app = express();

// --- Variáveis de ambiente ---
const PORT = process.env.PORT || 16002;
const API_DADOS_URL = process.env.API_DADOS_URL || "http://api_dados_server:16000/api";
const JWT_SECRET = process.env.JWT_SECRET || "secret_default_2026";
const COOKIE_NAME = process.env.COOKIE_NAME || "auth_token";
const AUTH_SERVER_URL = process.env.AUTH_SERVER_URL || "http://localhost:16001";
const LOGOUT_URL = process.env.LOGOUT_URL || "http://localhost:16001/logout";

// Routers
const indexRouter = require('./routes/index');
const recursosRouter = require('./routes/recursos');
const userRouter = require('./routes/users');

// Set views directory and view engine
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

// Middleware for parsing cookies, bodies and serving static files
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
// Configurar o CORS para aceitar pedidos do servidor de auth
app.use(cors({
    origin: AUTH_SERVER_URL,    // Origem permitida
    credentials: true,          // Permitir o envio de cookies
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// ==========================================
// MIDDLEWARE DE VERIFICAÇÃO DE AUTENTICAÇÃO
// ==========================================
const verificarAutenticacao = (req, res, next) => {
    // Extrair o token do cookie
    const token = req.cookies[COOKIE_NAME];

    if (!token) {
        console.log("Token não encontrado. Redirecionando para login...");
        return res.redirect(AUTH_SERVER_URL);
    }

    // Validar o token com o segredo partilhado
    jwt.verify(token, JWT_SECRET, (err, payload) => {
        if (err) {
            console.log("Token inválido ou expirado.");
            return res.redirect(AUTH_SERVER_URL);
        }
        else{
            // Guardamos os dados do utilizador (id e role) para uso nas rotas
            req.user = payload;
            // Preenche variáveis para as views aqui, após validação do token
            res.locals.logoutUrl = LOGOUT_URL;
            res.locals.auth_id = payload.sub || payload.id || null;
            res.locals.auth_role = payload.role || null;
            next();
        }    
    });
};

// Mount the routes
app.use('/', verificarAutenticacao, indexRouter);
app.use('/recursos', verificarAutenticacao, recursosRouter);
app.use('/users', verificarAutenticacao, userRouter);

app.listen(PORT, () => {
    console.log(`Interface a correr em http://localhost:${PORT}`);
});
