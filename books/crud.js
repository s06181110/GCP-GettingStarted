'use strict';

const express = require('express');
const bodyParser = require('body-parser');
const model = require('./model-cloudsql');

const router = express.Router();

// Automatically parse requrest body as form data
router.use(bodyParser.urlencoded({ extended: false }));

// Set Content-Type for all responses for these routes
router.use((req, res, next) => {
    res.set('Content-Type', 'text/html');
    next();
});

/**
 * GET /books
 *
 * Display a page of books (up to ten at a time).
 */
router.get('/', (req, res, next) => {
    model.list(10, req.query.pageToken, (err, entities, cursor) => {
        if (err) {
            next(err);
            return;
        }
        res.render('books/list.bug' , {
            books: entities,
            nextPageToken: cursor
        });
    });
});

/**
 * GET /books/add
 *
 * Display a form creating a book.
 */
// [START add_get]
router.get('/add', (req, res) => {
    res.render('books/form.pug', {
        book: {},
        action: 'Add'
    });
});
// [END add_get]

/**
 * POST /books/add
 *
 * Create a book.
 */
// [START add_post]
router.post('/add', (req, res, next) => {
    const data = req.body;

    // Save the data to the database.
    model.create(data, (err, savedData) => {
        if (err) {
            next(err);
            return;
        }
        res.redirect(`${req.baseUrl}/${savedData.id}`);
    });
});
// [END add_post]

/**
 * GET /books/:id/edit
 *
 * Display a book for editing.
 */
router.get('/:book/edit', (req, res, next) => {
    model.read(req.params.book, (err, entity) => {
        if (err) {
            next(err);
            return;
        }
        res.render('books/form.pug', {
            book: entity,
            action: 'Edit'
        });
    });
});

/**
 * POST /books/:id/edit
 *
 * Update a book.
 */
router.post('/:book/edit', (req, res, next) => {
    const data = req.body;

    model.update(req.params.book, data, (err, savedData) => {
        if (err) {
            next(err);
            return;
        }
        res.redirect(`${req.baseUrl}/${savedData.id}`);
    });
});

/**
 * GET /books/:id
 *
 * Display a book.
 */
router.get('/:book', (req, res, next) => {
    model.read(req.params.book, (err, entity) => {
        if (err) {
            next(err);
            return;
        }
        res.render('books/view.pug', {
            book: entity
        });
    });
});

/**
 * GET /books/:id/delete
 *
 * Delete a book.
 */
router.get('/:book/delete', (req, res, next) => {
    model.delete(req.params.book, (err) => {
        if (err) {
            next(err);
            return;
        }
        res.redirect(req.baseUrl);
    });
});

/**
 * Errors on "/books/*" routes.
 */
router.use((err, req, res, next) => {
    // Format error and forward to generic error handler for logging and
    // responding to the request
    err.response = err.message;
    next(err);
});

module.exports = router;