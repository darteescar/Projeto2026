const express = require('express');
const path = require('path');
const indexRouter = require('./routes/index');

const app = express();

// Set views directory and view engine
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

// Middleware for parsing bodies and serving static files
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));

// Mount the routes
app.use('/', indexRouter);

app.listen(3000, () => {
    console.log('Servidor à escuta na porta 3000: http://localhost:3000');
});