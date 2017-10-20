'use strict';

const path = require('path');
const https = require('https');
const fs = require('fs');

const express = require('express');

const config = require('./config');

const options = {
	key: fs.readFileSync(path.resolve(__dirname, '../keys/server.key')),
	cert: fs.readFileSync(path.resolve(__dirname, '../keys/server.crt')),
};
const app = express();

const server = https.createServer(options, app);

require('./socket')(server);

app.use(express.static(path.join(__dirname, '../public')));

module.exports = server;
