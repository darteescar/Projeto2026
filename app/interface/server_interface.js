const express = require('express');
const path = require('path');

// Routers
const indexRouter = require('./routes/index');
const recursosRouter = require('./routes/recursos');
const userRouter = require('./routes/users');

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
app.use('/recursos', recursosRouter);
app.use('/users', userRouter);

const PORT = process.env.PORT || 16002;

app.listen(PORT, () => {
    console.log(`Interface a correr em http://localhost:${PORT}`);
});
