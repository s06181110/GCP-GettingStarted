'use strict';

const express = require('express');

const app = express();

app.get('/', (req, res) => {
    res.status(200).send('Hello, world!');
});

if(module === require.main) {
    // [START server]
    const server = app.listen(process.env.PORT || 8080, () => {
        const port = server.address().port;
        console.log(`App listening on port ${port}`);
    });
    // [END server]
}

module.exports = app;
