'use strict';

const kurento = require('kurento-client');
const url = require('url');

const wsUrl = url.parse(config.server.kurentoSocketUri).href;

module.exports = (callback) => {
	kurento(wsUrl, (error, kurentoClient) => {
		if (error) {
			const message = `Could not find media server at address ${wsUrl}`;
			return callback(`${message} . Existing with error ${error}`);
		}
		callback(null, kurentoClient);
	});
};
