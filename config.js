'use strict';

const nconf = require('nconf');
const path = require('path');

nconf
    // Command-line arguments
    .argv()
    // Environment variables
    .env([
        'DATA_BACKEND',
        'GCLOUD_PROJECT',
        'INSTANCE_CONNECTION_NAME',
        'MYSQL_USER',
        'MYSQL_PASSWORD',
        'NODE_ENV',
        'PORT'
    ])
    // Config file
    .file({ file: path.join(__dirname, 'config.json')})
    // Defaults
    .defaults({
        PORT: 8080
    });

// Check for required setting
checkConfig('GCLOUD_PROJECT');

if (nconf.get('DATA_BACKEND') === 'cloudsql') {
    checkConfig('MYSQL_USER');
    checkConfig('MYSQL_PASSWORD');
    if (nconf.get('NODE_ENV') === 'production') {
        checkConfig('INSTANCE_CONNECTION_NAME');
    }
}

function checkConfig(setting) {
    if(!nconf.get(setting)){
        throw new Error(`You must set ${setting} as an environment variable or in config.json`);
    }
}