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
    console.log('  POST   /recursos');
    console.log('  GET    /recursos');
    console.log('  GET    /recursos?tipo=xxxx&ano=yyyy&uc=zzzz&autor=wwww');
    console.log('  GET    /recursos/:id');
    console.log('  PUT    /recursos/:id');
    console.log('  DELETE /recursos/:id');
    console.log('');
    console.log('  [COMENTÁRIOS]');
    console.log('  POST   /comentarios');
    console.log('  GET    /comentarios');
    console.log('  GET    /comentarios?recurso_id=xxxx');
    console.log('  GET    /comentarios/:id');
    console.log('  PUT    /comentarios/:id');
    console.log('  DELETE /comentarios/:id');
    console.log('');
    console.log('  [USERS]');
    console.log('  POST   /users');
    console.log('  GET    /users');
    console.log('  GET    /users?email=xxxx&password=yyyy');
    console.log('  GET    /users/:id');
    console.log('  PUT    /users/:id');
    console.log('  DELETE /users/:id');
});