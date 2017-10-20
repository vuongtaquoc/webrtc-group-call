'use strict';

const server = require('./core/server');

const config = require('./core/config');

server.listen(config.server.port, () => {
	console.log('App started at: ', config.server.port);
});
