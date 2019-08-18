'use strict';

const path = require('path');
const express = require('express');
const session = require('express-session');
const passport = require('passport');
const config = require('./config');

const app = express();

app.disable('etag');
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');
app.set('trust proxy', true);

// [START session]
// Configure the session and session storage.
const sessionConfig = {
    resave: false,
    saveUninitialized: false,
    secret: config.get('SECRET'),
    signed: true,
};

app.use(session(sessionConfig));
// [END session]

// OAuth2
app.use(passport.initialize());
app.use(passport.session());
app.use(require('./lib/oauth2').router);

// Books
app.use('/books', require('./books/crud'));
app.use('/api/books', require('./books/api'));

// Redirect root to /books
app.get('/', (req, res) => {
    res.redirect('/books');
});

// Basic 404 handler
app.use((req, res) => {
    res.status(404).send('Not Found');
});

// Basic error handler
app.use((err, req, res, next) => {
    /* jshint unused:false */
    console.error(err);
    // If our routes specified ap specific response, then send that.
    // Otherwise, send a generic message so as not to leak anything.
    res.status(500).send(err.response || 'Something broke!');
});

if(module === require.main) {
    // [START server]
    const server = app.listen(config.get('PORT'), () => {
        const port = server.address().port;
        console.log(`App listening on port ${port}`);
    });
    // [END server]
}

module.exports = app;
