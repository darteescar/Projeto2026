const express = require('express');
const axios = require('axios');
const path = require('path');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const bcrypt = require('bcrypt');

const app = express();

// --- Variáveis de ambiente ---
const PORT = process.env.PORT || 16001;
const API_DADOS_URL = process.env.API_DADOS_URL || "http://api_dados_server:16000/api";
const JWT_SECRET = process.env.JWT_SECRET || "ENGWEB_PROJETO_2026";
const COOKIE_NAME = process.env.COOKIE_NAME || "auth_token";
const INTERFACE_URL = process.env.INTERFACE_URL || "http://localhost:16002/";

// Função para validar senha forte
function validatePassword(password) {
    const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return regex.test(password);
}

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// Rota de escolha (Ponto de entrada para não autenticados)
app.get('/', (req, res) => {
    res.render('index', { title: 'Recursos LEI' }); 
});


// GET login
app.get('/login', (req, res) => {
    res.render('login', { title: 'Login | Recursos LEI' });
});


// GET register
app.get('/register', (req, res) => {
    res.render('register', { title: 'Registo | Recursos LEI' });
});


// GET logout
app.get('/logout', (req, res) => {
    res.clearCookie(COOKIE_NAME);
    res.redirect('/');
});


// POST login: gera o JWT e guarda no cookie
app.post('/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const response = await axios.get(`${API_DADOS_URL}/users?email=${email}`);
        const users = response.data;

        if (users.length > 0) {
            const user = users[0];
            const isPasswordValid = await bcrypt.compare(password, user.password);
            if (isPasswordValid) {
                const token = jwt.sign(
                    { id: user.id, email: user.email, nome: user.nome, apelido: user.apelido, role: user.role },
                    JWT_SECRET,
                    { expiresIn: '1h' }
                );

                res.cookie(COOKIE_NAME, token, {
                    httpOnly: true, // Segurança contra XSS
                    secure: process.env.NODE_ENV === 'production', 
                    maxAge: 3600000 // 1 hora
                });

                return res.redirect(INTERFACE_URL);
            } else {
                res.render('login', { error: "Credenciais inválidas", titulo: "Login | Recursos LEI" });
            }
        } else {
            res.render('login', { error: "Credenciais inválidas", titulo: "Login | Recursos LEI" });
        }
    } catch (err) {
        res.status(500).render('error', { message: "Erro na API de Dados", error: err });
    }
});


// POST alterar password (API interna)
app.post('/api/change-password', async (req, res) => {
    const { userId, password_atual, password_nova } = req.body;

    if (!validatePassword(password_nova)) {
        return res.status(400).json({ error: 'A nova palavra-passe deve ter pelo menos 8 caracteres, incluindo 1 minúscula, 1 maiúscula, 1 número e 1 carácter especial.' });
    }

    try {
        const response = await axios.get(`${API_DADOS_URL}/users/${userId}`);
        let user = response.data;

        const isCurrentPasswordValid = await bcrypt.compare(password_atual, user.password);
        if (!isCurrentPasswordValid) {
            return res.status(400).json({ error: 'A palavra-passe atual está incorreta.' });
        }

        const hashedNewPassword = await bcrypt.hash(password_nova, 10);
        user.password = hashedNewPassword;
        await axios.put(`${API_DADOS_URL}/users/${userId}`, user);

        res.status(200).json({ message: 'Password atualizada com sucesso' });
    } catch (err) {
        res.status(500).json({ error: 'Erro ao comunicar com a API de Dados' });
    }
});


// POST register
app.post('/register', (req, res) => {
    const { nome, apelido, email, password, confirmPassword } = req.body;

    if (password !== confirmPassword) {
        return res.render('register', { error: "As passwords não coincidem", formData: req.body, title: "Registo | Recursos LEI" });
    }

    if (!validatePassword(password)) {
        return res.render('register', { error: "A palavra-passe deve ter pelo menos 8 caracteres, incluindo 1 minúscula, 1 maiúscula, 1 número e 1 carácter especial.", formData: req.body, title: "Registo | Recursos LEI" });
    }

    axios.post(`${API_DADOS_URL}/users`, { nome, apelido, email, password })
        .then(() => {
            res.redirect('/login');
        })
        .catch(err => {
            if (err.response && err.response.status === 400) {
                res.render('register', { error: "Email já registado", formData: req.body, title: "Registo | Recursos LEI" });
            } else {
                res.status(500).render('error', { message: "Erro na API de Dados" , error: err});
            }
        });
 
});

// Middleware para tratar rotas não encontradas (404)
app.use((req, res) => {
    res.status(404).render('error', { 
        message: "404 - Página não encontrada", 
        error: { status: 404, stack: "A rota a que tentou aceder não existe neste servidor." } 
    });
});

app.listen(PORT, () => {
    console.log(`Auth Server a correr em http://localhost:${PORT}`)
});