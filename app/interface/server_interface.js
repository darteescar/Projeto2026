const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const cors = require('cors');

const app = express();

// --- Variáveis de ambiente ---
const PORT = process.env.PORT || 16002;
const AUTH_SERVER_URL = process.env.AUTH_SERVER_URL || "http://localhost:16001";

// Routers
const indexRouter = require('./routes/index');
const recursosRouter = require('./routes/recursos');
const userRouter = require('./routes/users');
const adminRouter = require('./routes/admin');

// Middlewares
const { 
    verificarAutenticacao,
    requireMinimumRole
} = require('./middleware');

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

// Mount the routes
app.use('/', verificarAutenticacao, indexRouter);
app.use('/recursos', verificarAutenticacao, recursosRouter);
app.use('/users', verificarAutenticacao, userRouter);
app.use('/admin', verificarAutenticacao, requireMinimumRole('admin'), adminRouter); // apenas os admins podem aceder às rotas

// Middleware para tratar rotas não encontradas (404)
app.use((req, res) => {
    res.status(404).render('error', { 
        message: "404 - Página não encontrada", 
        error: { status: 404, stack: "A rota solicitada não foi encontrada neste servidor." } 
    });
});

app.listen(PORT, () => {
    console.log(`Interface a correr em http://localhost:${PORT}`);
});
