'use strict';

const express = require('express');
const bodyParser = require('body-parser');
const model = require('./model-cloudsql');

const router = express.Router();

// Automatically parse request body as JSON
router.use(bodyParser.json());

/**
 * GET /api/books
 *
 * Retrieve a page of books (up to ten at a time).
 */
router.get('/', (req, res, next) => {
    model.list(10, req.query.pageToken, (err, entities, cursor) => {
        if (err) {
            next(err);
            return;
        }
        res.json({
            item: entities,
            nextPageToken: cursor
        });
    });
});

/**
 * GET /api/books/:id
 *
 * Retrieve a book.
 */
router.get('/:book', (req, res, next) => {
    model.read(req.params.book, (err, entity) => {
        if (err) {
            next(err);
            return;
        }
        res.json(entity);
    });
});

/**
 * PUT /api/books/:id
 *
 * Update a book.
 */
router.put('/:book', (req, res, next) => {
    model.update(req.params.book, req.body, (err, entity) => {
        if (err) {
            next(err);
            return;
        }
        res.json(entity);
    });
});

/**
 * DELETE /api/books/:id
 *
 * Delete a book.
 */
router.delete('/book', (req, res, next) => {
    model.delete(req.params.book, (err) => {
        if (err) {
            next(err);
            return;
        }
        res.status(200).send('OK');
    });
});

/**
 * Errors on "/api/books/*" routes.
 */
router.use((err, req, res, next) => {
    // Format error and forward to generic error handler for logging and
    // responding to the request
    err.response = {
        message: err.message,
        internalCode: err.code
    };
    next(err);
});

module.exports = router;
