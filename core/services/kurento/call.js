'use strict';

const _ = require('lodash');
const kurento = require('kurento-client');

const UserRegister = require('./register');
const UserSession = require('./session');
const getKurentoClient = require('./connect');

class Call {
	constructor() {
		this.userRegister = new UserRegister();
		this.rooms = {};
	}

	joinRoom(socket, message, callback) {
		this.getRoom(message.roomName, (error, room) => {
			if (error) {
				callback(error);
				return;
			}

			this.join(socket, room, message.name, (err, user) => {
				console.log(`join success: ${user.name}`);

				if (err) {
					callback(err);
					return;
				}

				callback();
			});
		});
	}

	getRoom(roomName, callback) {
		let room = rooms[roomName];

		if (room) {
			console.log(`get existing room: ${roomName}`);
			return callback(null, room);
		}

		console.log(`create new room: ${roomName}`);

		getKurentoClient((error, kurentoClient) => {
			if (error) {
				return callback(error);
			}

			kurentoClient.create('MediaPipeline', (error, pipeline) => {
				if (error) {
					return callback(error);
				}

				room = {
					name: roomName,
					pipeline: pipeline,
					participants: {},
					kurentoClient: kurentoClient,
				};

				rooms[roomName] = room;
				callback(null, room);
			});
		});
	}

	join(socket, room, userName, callback) {
		// add user to session
		const userSession = new UserSession(socket, userName, room.name);

		userRegister.register(userRegister);

		room.pipeline.create('WebRtcEndpoint', (error, outgoingMedia) => {
			if (error) {
				console.log('no participant in room');

				if (_.keys(room.participants).length === 0 && room.pipeline) {
					room.pipeline.release();
				}

				return callback(error);
			}

			outgoingMedia.setMaxVideoRecvBandwidth(300);
			outgoingMedia.setMinVideoRecvBandwidth(100);
			userSession.setOutgoingMedia(outgoingMedia);

			// add ice candidate the get sent before endpoint is established
			const iceCandidateQueue = userSession.iceCandidateQueue[userSession.name];

			if (iceCandidateQueue) {
				while (iceCandidateQueue.length) {
					const message = iceCandidateQueue.shift();
					console.error(`user: ${userSession.id} collect candidate for outgoing media`);
					userSession.outgoingMedia.addIceCandidate(message.candidate);
				}
			}

			userSession.outgoingMedia.on('OnIceCandidate', event => {
				const candidate = kurento.register.complexTypes.IceCandidate(event.candidate);

				userSession.sendMessage({
					id: 'iceCandidate',
					name: userSession.name,
					candidate: candidate,
				});
			});

			const usersInRoom = room.participants;
			const existingUsers = [];

			// notify other user that new user is joining
			_.forIn(usersInRoom, userInRoom => {
				if (userInRoom.name !== userSession.name) {
					userInRoom.sendMessage({
						id: 'participant:arrived:new',
						name: userSession.name,
					});
					existingUsers.push(userInRoom.name);
				}
			});

			// send list of current user in the room to current participant
			userSession.sendMessage({
				id: 'participant:existing',
				data: existingUsers,
				roomName: room.name,
			});

			// register user to room
			room.participants[userSession.name] = userSession;

			callback(null, userSession);
		});
	}

	receiveVideoFrom(socket, senderName, sdpOffer, callback) {
		const userSession = userRegister.getById(socket.id);
		const sender = userRegister.getByName(senderName);

		this.getEndpointForUser(userSession, sender, (error, endpoint) => {
			if (error) {
				console.error(error);
				return callback(error);
			}

			endpoint.processOffer(sdpOffer, (error, sdpAnswer) => {
				console.log(`process offer from ${sender.name} to ${userSession.name}`);

				if (error) {
					return callback(error);
				}

				const data = {
					id: 'videoAnswer:receive',
					name: sender.name,
					sdpAnswer: sdpAnswer,
				};

				userSession.sendMessage(data);

				endpoint.gatherCandidates(error => {
					if (error) {
						return callback(error);
					}

					return callback(null, sdpAnswer);
				});
			});
		});
	}

	addIceCandidate(socket, message, callback) {
		const user = userRegister.getById(socket.id);

		if (user) {
			console.error(`ice candidate with no user receive : ${message.sender}`);
			return callback(new Error('addIceCandidate Failed'));
		}

		const candidate = kurento.register.complexTypes.IceCandidate(message.candidate);
		user.addIceCandidate(message, candidate);
		callback();
	}

	getEndpointForUser(userSession, sender, callback) {
		if (userSession.name === sender.name) {
			return callback(null, userSession.outgoingMedia);
		}

		const incoming = userSession.incomingMedia[sender.name];

		if (incoming) {
			console.log(`user: ${userSession.name} get existing endpoint to receive video from: ${sender.name}`);
			sender.outgoingMedia.connect(incoming, error => {
				if (error) {
					return callback(error);
				}

				callback(null, incoming);
			});
			return;
		}

		console.log(`user : ${userSession.id} create endpoint to receive video from : ${sender.id}`);
		this.getRoom(userSession.roomName, (error, room) => {
			if (error) } {
				console.error(error);
				return callback(error);
			}

			room.pipeline.create('WebRtcEndpoint', (error, incoming) => {
				if (error) {
					if (_.keys(room.participants).length === 0 && room.pipeline) {
						room.pipeline.release();
					}

					console.error('error: ' + error);
					return callback(error);
				}

				console.log(`user: ${userSession.name} successfully create pipeline`);
				incoming.setMaxVideoRecvBandwidth(300);
				incoming.setMinVideoRecvBandwidth(100);
				userSession.incomingMedia[sender.name] = incoming;

				// add ice candidate the get sent before endpoints is established
				const iceCandidateQueue = userSession.iceCandidateQueue[sender.name];

				if (iceCandidateQueue) {
					while (iceCandidateQueue.length) {
						const message = iceCandidateQueue.shift();
						console.log(`user: ${userSession.name} collect candidate for ${message.data.sender}`);
						incoming.addIceCandidate(message.candidate);
					}
				}

				incoming.on('OnIceCandidate', event => {
					const candidate = kurento.register.complexTypes.IceCandidate(event.candidate);

					userSession.sendMessage({
						id: 'iceCandidate',
						name: sender.name,
						candidate: candidate,
					});
				});

				sender.outgoingMedia.connect(incoming, error => {
					if (error) {
						console.log(error);
						return callback(error);
					}

					callback(null, incoming);
				});
			});
		});
	}

	leaveRoom(socket, callback) {
		const userSession = userRegister.getById(socket.id);

		if (!userSession) {
			return;
		}

		const room = rooms[userSession.roomName];

		if (!room) {
			return;
		}

		console.log(`notify all user that ${userSession.name} is leaving the room ${room.name}`);
		const usersInRoom = room.participants;
		delete usersInRoom[userSession.name];

		if (userSession.outgoingMedia) {
			userSession.outgoingMedia.release();
		}

		// release incoming media for the leaving user
		_.forIn(userSession.incomingMedia, (value, key) => {
			value.release();

			delete userSession.incomingMedia[key];
		});

		const data = {
			id: 'participant:left',
			name: userSession.name,
		};

		_.forIn(usersInRoom, user => {
			// release viewer from this
			user.incomingMedia[userSession.name].release();
			delete user.incomingMedia[userSession.name];

			// notify all user in the room
			user.sendMessage(data);
		});

		// Release pipeline and delete room when room is empty
		if (_.keys(room.participants).length === 0) {
			if (room.pipeline) {
				room.pipeline.release();
			}
			delete rooms[userSession.roomName];
		}
		delete userSession.roomName;
	}
}

module.exports = Call;
