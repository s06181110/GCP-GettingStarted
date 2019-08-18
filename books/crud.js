'use strict';

const express = require('express');
const bodyParser = require('body-parser');
const images = require('../lib/images');
const oauth2 = require('../lib/oauth2');
const model = require('./model-cloudsql');

const router = express.Router();

router.use(oauth2.template);

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
        res.render('books/list.pug' , {
            books: entities,
            nextPageToken: cursor
        });
    });
});

//[START mine]
// ログインしたユーザーのみがこのハンドラーにアクセスできるように、
// oauth2.requiredミドルウェアを使用します。
router.get('/mine', oauth2.required, (req, res, next) => {
    model.listBy(
        req.user.id,
        10,
        req.query.pageToken,
        (err, entities, cursor) => {
            if (err) {
                next(err);
                return;
            }
            res.render('books/list.pug', {
                books: entities,
                nextPageToken: cursor,
            });
        }
    );
});
//[END mine]

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
router.post(
    '/add',
    images.multer.single('image'),
    images.sendUploadToGCS,
    (req, res, next) => {
        const data = req.body;

        if (req.user) {
            data.createdBy = req.user.displayName;
            data.createdById = req.user.id;
        } else {
            data.createdBy = 'Anonymous';
        }

        // Was an image uploaded? If so, we'll use its public URL.
        // in cloud storage.
        if (req.file && req.file.cloudStoragePublicUrl) {
            data.imageUrl = req.file.cloudStoragePublicUrl;
        }

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
router.post(
    '/:book/edit',
    images.multer.single('image'),
    images.sendUploadToGCS,
    (req, res, next) => {
        const data = req.body;

        // Was an image uploaded? If so, we'll use its public URL.
        // in cloud storage.
        if (req.file && req.file.cloudStoragePublicUrl) {
            req.body.imageUrl = req.file.cloudStoragePublicUrl;
        }

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