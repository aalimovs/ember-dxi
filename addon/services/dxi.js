import Ember from 'ember';
import config from '../config/environment';

export default Ember.Service.extend({
	token: null,
	agents: null,
	outcomes: null,

	init() {
		console.log("dxi.init()");
		this._super(...arguments);
		this.obtainToken();
		this.getAgents();
		this.getOutcomes();
	},

	obtainToken() {
		console.log("dxi.obtainToken()");
		var that = this;
		return new Ember.RSVP.Promise(function(resolve, reject) {
			Ember.$.ajax({
				type: 'GET',
				url: config.dxi.url + '/token.php',
				data: {
					action: 'get',
					username: config.dxi.username,
					password: config.dxi.password
				}
			}).then(function(data) {
				data = JSON.parse(data);
				if(data.success === true && data.token) {
					that.set('token', data.token);
					Ember.run(null, resolve, data.token);
				} else {
					Ember.run(null, reject, data);
				}
			}, function(jqXHR) {
				jqXHR.then = null; // tame jQuery's ill mannered promises
				Ember.run(null, reject, jqXHR);
			});
		})
	},

	query(url, query) {
		console.log("dxi.query(" + url + ", " + JSON.stringify(query) + ")");
		var that = this;

		var retried = 0;
		var retryMax = 5;

		query.format = "json";
		query.raw = "1";
		query.table = config.dxi.table;

		return retry(function() {
			query.token = that.get('token');
			return new Ember.RSVP.Promise(function(resolve, reject) {
				Ember.$.ajax({
					type: 'GET',
					url: config.dxi.url + url,
					data: query
				}).then(function(data) {
					data = JSON.parse(data);
					if(data.success === true) {
						Ember.run(null, resolve, data);
					} else {
						Ember.run(null, reject, data);
					}
				}, function(jqXHR) {
					Ember.run(null, reject, jqXHR);
				});
			});
		});

		function retry(f) {
			return f().then(
				undefined,
				function(error) {
					if(retried >= retryMax) {
						throw error;
					} else {
						console.log("dxi.query(" + url + ", query), retrying because", error);
						retried++;
						return retry(f);
					}
				}
			)
		}

	},

	getAgents() {
		var that = this;
		this.query('/database.php', {
			method: 'agents',
			action: 'read'
		}).then(function(data) {
			that.set('agents', _.indexBy(data.list, "agentid"));
		})
	},

	getOutcomes() {
		var that = this;
		this.query('/database.php', {
			method: 'outcomecodes',
			action: 'read'
		}).then(function(data) {
			that.set('outcomes', _.indexBy(data.list, "outcome"));
		})
	}
});