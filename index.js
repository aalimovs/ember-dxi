/* jshint node: true */
'use strict';

module.exports = {
  name: 'ember-dxi',

  included: function(app) {
    this.app.import(app.bowerDirectory + '/lodash/lodash.min.js');
  }
};
