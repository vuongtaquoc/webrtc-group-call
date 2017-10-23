;(function(exports, sendMessage) {
	var PARTICIPANT_MAIN = 'participant-main';
	var PARTICIPANT = 'participant';

	function Participant(name, isPublisher) {
		this.name = name;
		this.isPublisher = isPublisher;

		Object.defineProperty(this, 'rtcPeer', {
			writable: true,
		});

		this.append();
	}

	Participant.prototype.append = function() {
		var container = document.createElement('div');
		container.classList.add(PARTICIPANT);

		if (this.isPublisher) {
			container.classList.add(PARTICIPANT_MAIN)
		}
		container.id = this.name;

		var span = document.createElement('span');
		var video = document.createElement('video');

		container.appendChild(video);
		container.appendChild(span);

		document.getElementById('participants').appendChild(container);

		video.id = 'video-' + this.name;
		video.autoplay = true;
		video.controls = false;

		this.container = container;
		this.video = video;
	};

	Participant.prototype.offerToReceiveVideo = function(error, offerSdp, wp) {
		if (error) {
			return console.error('sdp offer error');
		}

		console.log('Invoking SDP offer callback function');

		exports.sendMessage({
			id: 'receiveVideoFrom',
			sender: this.name,
			sdpOffer: offerSdp,
		});
	};

	Participant.prototype.onIceCandidate = function(candidate, wp) {
		console.log('Local candidate: ', candidate);

		exports.sendMessage({
			id: 'onIceCandidate',
			candidate: candidate,
			sender: this.name,
		});
	};

	Participant.prototype.dispose = function() {
		console.log('Disposing participant: ', this.name);

		this.rtcPeer.dispose();

		this.container.parentNode.removeChild(this.container);
	};

	exports.Participant = Participant;
})(window);
