'use strict';

const _ = require('lodash');

const config = {
	all: {
		server: {
			port: 2000,
			kurentoSocketUri: 'ws://localhost:8888/kurento',
		},
	},
	dev: {

	},
};
const env = process.env.NODE_ENV || 'dev';

module.exports = _.defaults(config[env], config.all);
