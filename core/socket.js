'use strict';

const url = require('url');
const socketIO = require('socket.io');

const Call = require('./services/kurento/call');

const config = require('./config');

module.exports = (server) => {
	const io = socketIO(server).path('/group-call');
	const wsUrl = url.parse(config.server.kurentoSocketUri).href;
	const call = new Call();

	io.on('connection', socket => {
		socket.on('error', error => {
			console.error(`Connection %s error : %s`, socket.id, error);
		});

		socket.on('disconnect', data => {
			console.log(`Connection : %s disconnect`, data);
		});

		socket.on('message', message => {
			console.log(`Connection: %s receive message`, message.id);

			switch (message.id) {
				case 'joinRoom':
					call.joinRoom(socket, message, error => {
						if (error) {
							console.error(`join room error ${error}`);
						}
					});
					break;
				case 'receiveVideoFrom':
					call.receiveVideoFrom(socket, message.sender, message.sdpOffer, error => {
						if (error) {
							console.error(error);
						}
					});
					break;
				case 'leaveRoom':
					call.leaveRoom(socket, error => {
						if (error) {
							console.error(error);
						}
					});
					break;
				case 'onIceCandidate':
					call.addIceCandidate(socket, message, error => {
						if (error) {
							console.error(error);
						}
					});
					break;
				default:
					socket.emit({
						id: 'error',
						msg: `Invalid message ${message}`,
					});
					break;
			}
		});
	});
};
