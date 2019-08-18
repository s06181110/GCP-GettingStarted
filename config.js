'use strict';

const nconf = module.exports = require('nconf');
const path = require('path');

nconf
    // Command-line arguments
    .argv()
    // Environment variables
    .env([
        'CLOUD_BUCKET',
        'NODE_ENV',
        'GCLOUD_PROJECT',
        'INSTANCE_CONNECTION_NAME',
        'MYSQL_USER',
        'MYSQL_PASSWORD',
        'OAUTH2_CLIENT_ID',
        'OAUTH2_CLIENT_SECRET',
        'OAUTH2_CALLBACK',
        'PORT',
        'SECRET',
    ])
    // Config file
    .file({ file: path.join(__dirname, 'config.json')})
    // Defaults
    .defaults({
        CLOUD_BUCKET: '',

        DATA_BACKEND: 'cloudsql',

        MYSQL_USER: '',
        MYSQL_PASSWORD: '',

        PORT: 8080,
        SECRET: 'keyboardcat',
    });

// Check for required setting
checkConfig('GCLOUD_PROJECT');
checkConfig('CLOUD_BUCKET');
checkConfig('OAUTH2_CLIENT_ID');
checkConfig('OAUTH2_CLIENT_SECRET');
checkConfig('MYSQL_USER');
checkConfig('MYSQL_PASSWORD');
if (nconf.get('NODE_ENV') === 'production') {
    checkConfig('INSTANCE_CONNECTION_NAME');
}

function checkConfig(setting) {
    if(!nconf.get(setting)){
        throw new Error(`You must set ${setting} as an environment variable or in config.json`);
    }
}