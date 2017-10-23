;(function(exports, Participant) {
	var socket = exports.socket = io('https://' + location.host);
	var participants = {};
	var name;

	var sendMessage = window.sendMessage = function(message) {
		console.log('Sending message: ', message);
		socket.emit('message', message);
	};

	window.onbeforeunload = function() {
		socket.disconnect();
	};

	socket.on('connect', function() {
		console.log('web socket connect success');
	});

	socket.on('message', function(message) {
		console.log('Received message: ' + message.id);

		switch (message.id) {
			case 'participant:existing':
				onExistingParticipants(message);
				break;
			case 'participant:arrived:new':
				onNewParticipant(message);
				break;
			case 'participant:left':
				onParticipantLeft(message);
				break;
			case 'videoAnswer:receive':
				receiveVideoResponse(message);
				break;
			case 'iceCandidate':
				participants[message.name].rtcPeer.addIceCandidate(message.candidate, function(error) {
					if (error) {
						console.error('Error adding candidate: ' + error);
						return;
					}
				});
				break;
			default:
				console.error('Unrecognized message ', message);
		}
	});

	function onNewParticipant(request) {
		receiveVideo(request.name);
	}

	function onExistingParticipants(message) {
		var constraints = {
			audio: true,
			video: {
				mandatory: {
					maxWidth: 640,
					maxFrameRate: 15,
					minFrameRate: 15,
				},
			},
		};
		// console.log(name + ' registered in room ' + room);
		console.log('onExistingParticipants', message);
		var participant = new Participant(name, true);
		participants[name] = participant;
		var video = participant.video;
		var options = {
			localVideo: video,
			mediaConstraints: constraints,
			onicecandidate: participant.onIceCandidate.bind(participant),
		};

		participant.rtcPeer = new kurentoUtils.WebRtcPeer.WebRtcPeerSendonly(options, function(error) {
			if (error) {
				return console.error(error);
			}

			this.generateOffer(participant.offerToReceiveVideo.bind(participant));
		});

		message.data.forEach(receiveVideo);
	}

	function receiveVideo(sender) {
		var participant = new Participant(sender, false);

		participants[sender] = participant;

		var video = participant.video;
		var options = {
			remoteVideo: video,
			onicecandidate: participant.onIceCandidate.bind(participant),
		};

		participant.rtcPeer = new kurentoUtils.WebRtcPeer.WebRtcPeerRecvonly(options, function(error) {
			if (error) {
				return console.error(error);
			}

			this.generateOffer(participant.offerToReceiveVideo.bind(participant));
		});
	}

	function onParticipantLeft(request) {
		console.log('Participant ' + request.name + ' left');
		var participant = participants[request.name];
		participant.dispose();
		delete participants[request.name];
	}

	function receiveVideoResponse(result) {
		participants[result.name].rtcPeer.processAnswer(result.sdpAnswer, function(error) {
			if (error) {
				return console.error(error);
			}
		});
	}

	document.getElementById('create-room').addEventListener('submit', function(e) {
		e.preventDefault();

		var roomName = document.getElementById('room-name').value;
		var roomUser = name = document.getElementById('room-user').value;

		document.getElementById('create-room').style.display = 'none';
		document.getElementById('room-info').style.display = 'block';
		document.getElementById('room-title').innerText = 'Room: ' + roomName;

		sendMessage({
			id: 'joinRoom',
			name: roomUser,
			roomName: roomName,
		});
	});

	document.getElementById('button-leave').addEventListener('click', function(e) {
		sendMessage({
			id: 'leaveRoom',
		});

		for (var key in participants) {
			participants[key].dispose();
		}

		document.getElementById('create-room').style.display = 'block';
		document.getElementById('room-info').style.display = 'none';

		socket.close();
	});
})(window, window.Participant);
