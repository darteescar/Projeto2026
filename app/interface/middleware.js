const jwt = require('jsonwebtoken');
const axios = require('axios');

const JWT_SECRET = process.env.JWT_SECRET || "secret_default_2026";
const COOKIE_NAME = process.env.COOKIE_NAME || "auth_token";
const AUTH_SERVER_URL = process.env.AUTH_SERVER_URL || "http://localhost:16001";
const LOGOUT_URL = process.env.LOGOUT_URL || "http://localhost:16001/logout";
const API_DADOS_URL = process.env.API_DADOS_URL || 'http://api-dados:16000/api';

const ROLE_HIERARCHY = {
    'consumidor': 1,
    'produtor': 2,
    'admin': 3
};

// Middleware para verificar autenticação
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
            res.locals.AUTH_ID = payload.id;
            
            res.locals.AUTH_LEVEL = ROLE_HIERARCHY[payload.role] || 0;
            res.locals.ROLE_LEVELS = ROLE_HIERARCHY;
            next();
        }    
    });
};

// Callback para verificar se o utilizador tem um cargo mínimo para aceder à rota
const requireMinimumRole = (minimumRole) => {
    return (req, res, next) => {
        // Se o utilizador não estiver autenticado ou não tiver role
        if (!req.user || !req.user.role) {
            return res.status(403).render('error', { 
                message: "403 - Acesso Negado", 
                error: { status: 403, stack: "Autenticação em falta." } 
            });
        }

        const userLevel = ROLE_HIERARCHY[req.user.role] || 0;
        const requiredLevel = ROLE_HIERARCHY[minimumRole] || 999;

        // Se o cargo do utilizador for igual ou superior ao exigido, deixa passar
        if (userLevel >= requiredLevel) {
            next();
        } else {
            // Caso contrário, é bloqueado
            res.status(403).render('error', { 
                message: "403 - Acesso Negado", 
                error: { status: 403, stack: `Acesso restrito. Requer permissão de nível ${minimumRole}.` } 
            });
        }
    };
};

// Callback para verificar se o utilizador é o proprietário do recurso ou se é admin
const isOwnerResourceOrAdmin = async (req, res, next) => {
    try {
        const userLevel = res.locals.AUTH_LEVEL || 0;
        const currentID = res.locals.AUTH_ID;

        if (userLevel >= 3) return next(); // Admin contorna a verificação

        const resp = await axios.get(`${API_DADOS_URL}/recursos/${req.params.id}`);
        if (Number(resp.data.autor) === Number(currentID)) {
            return next();
        }
        
        res.status(403).render('error', { 
            message: "403 - Acesso Negado", 
            error: { status: 403, stack: "Acesso restrito. Apenas o proprietário ou um administrador pode modificar este recurso." } 
        });
    } catch (err) {
        res.status(500).render('error', { message: 'Erro ao verificar permissões.', error: err });
    }
};

// Callback para verificar se o utilizador é o proprietário do perfil a editar
const isOwnerProfile = (req, res, next) => {
    const targetID = req.params.id;
    const currentID = res.locals.AUTH_ID;

    if (Number(targetID) === Number(currentID)) {
        next();
    } else {
        res.status(403).render('error', { 
            message: "403 - Acesso Negado", 
            error: { status: 403, stack: "Acesso restrito. Apenas o próprio utilizador pode editar o seu perfil." } 
        });
    }
};

module.exports = {
    ROLE_HIERARCHY,
    verificarAutenticacao,
    requireMinimumRole,
    isOwnerResourceOrAdmin,
    isOwnerProfile
};
