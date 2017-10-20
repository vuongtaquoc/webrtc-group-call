'use strict';

class Register {
	constructor() {
		this.usersByName = {};
		this.userSessionIds = {};
	}

	register(user) {
		this.usersByName[user.name] = user;
		this.userSessionIds[user.id] = user;
	}

	unregister(name) {
		const user = this.getByName(name);

		if (user) {
			delete this.usersByName[user.name];
			delete this.userSessionIds[user.id];
		}
	}

	removeByName(name) {
		const user = this.getByName(name);

		if (user) {
			delete this.usersByName[user.name];
			delete this.userSessionIds[user.id];
		}
	}

	getByName(name) {
		return this.usersByName[name];
	}

	getById(id) {
		return this.userSessionIds[id];
	}
}

module.exports = Register;
