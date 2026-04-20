const express = require('express');
const path = require('path');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const SECRET = "ENGWEB_PROJETO_2026";

function verificaAcesso(req, res, next) {
    const token = req.cookies?.token;
    if (!token) {
        return res.redirect('http://localhost:16001/');
    }

    jwt.verify(token, SECRET, (err, payload) => {
        if (err) {
            res.clearCookie('token');
            return res.redirect('http://localhost:16001/');
        }
        req.user = payload; // Disponibiliza o utilizador para as rotas e pugs
        next();
    });
}

// Routers
const indexRouter = require('./routes/index');
const recursosRouter = require('./routes/recursos');
const userRouter = require('./routes/users');

const app = express();

// Set views directory and view engine
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

// Middleware for parsing cookies, bodies and serving static files
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));

// Mount the routes
app.use('/', verificaAcesso, require('./routes/index'));
app.use('/recursos', verificaAcesso, recursosRouter);
app.use('/users', verificaAcesso, userRouter);

const PORT = process.env.PORT || 16002;

app.listen(PORT, () => {
    console.log(`Interface a correr em http://localhost:${PORT}`);
});
