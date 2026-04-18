const express = require('express');
const mongoose = require('mongoose');
const app = express();

// Routers
const recursoRouter = require('./routes/recursoRouter');
const comentarioRouter = require('./routes/comentarioRouter');
const userRouter = require('./routes/userRouter');

app.use(express.json());

// Logger
app.use(function(req, res, next) {
    var d = new Date().toISOString().substring(0, 16);
    console.log(req.method + " " + req.url + " " + d);
    next();
});

// Conexão ao MongoDB
const nomeBD = "recursosEscolares";
const mongoHost = process.env.MONGO_URL || `mongodb://127.0.0.1:27017/${nomeBD}`;
mongoose.connect(mongoHost)
    .then(() => console.log(`MongoDB: liguei-me à base de dados ${nomeBD}.`))
    .catch(err => console.error('Erro na ligação ao MongoDB:', err));

// Rotas
app.use('/api', recursoRouter);
app.use('/api', comentarioRouter);
app.use('/api', userRouter);


const PORT = process.env.PORT || 16000;

// Arrancar o servidor
app.listen(PORT, () => {
    console.log(`API de dados a correr em http://localhost:${PORT}`);
    console.log('Rotas disponíveis:');
    console.log('  [RECURSOS]');
    console.log('  POST   /api/recursos');
    console.log('  GET    /api/recursos');
    console.log('  GET    /api/recursos?tipo=xxxx&ano=yyyy&uc=zzzz&autor=wwww');
    console.log('  GET    /api/recursos?q=texto&_select=titulo,uc&_sort=data_registo&_order=desc');
    console.log('  GET    /api/recursos?visibilidade=publico&_sort=data_registo&_order=desc');
    console.log('  GET    /api/recursos/:id');
    console.log('  PUT    /api/recursos/:id');
    console.log('  DELETE /api/recursos/:id');
    console.log('');
    console.log('  [COMENTÁRIOS]');
    console.log('  POST   /api/comentarios');
    console.log('  GET    /api/comentarios');
    console.log('  GET    /api/comentarios?recurso_id=xxxx');
    console.log('  GET    /api/comentarios?q=texto&_select=descricao,avaliacao&_sort=data&_order=desc');
    console.log('  GET    /api/comentarios?recurso_id=xxxx&_sort=data&_order=desc');
    console.log('  GET    /api/comentarios/:id');
    console.log('  PUT    /api/comentarios/:id');
    console.log('  DELETE /api/comentarios/:id');
    console.log('');
    console.log('  [USERS]');
    console.log('  POST   /api/users');
    console.log('  GET    /api/users');
    console.log('  GET    /api/users?email=xxxx&password=yyyy');
    console.log('  GET    /api/users?q=texto&_select=nome,apelido,email&_sort=data_criacao&_order=asc');
    console.log('  GET    /api/users?sort=data_criacao&order=asc');
    console.log('  GET    /api/users/:id');
    console.log('  PUT    /api/users/:id');
    console.log('  DELETE /api/users/:id');
});