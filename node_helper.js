"use strict";
/**
 * Node Helper: EXT-Bring
 *
 * By Robert Seidt
 * modified by @bugsounet
 * MIT Licensed.
 **/

var NodeHelper = require("node_helper");
var parseData = require("./components/parseData.js")
var logBring = (...args) => { /* do nothing */ }

module.exports = NodeHelper.create({
  start: function () {
    this.parseData = new parseData(this)
  },

  socketNotificationReceived: function (notification, payload) {
    switch (notification) {
      case "INIT":
        this.config = payload
        if (this.config.debug) logBring = (...args) => { console.log("[BRING]", ...args) }
        console.log("[BRING] " + require('./package.json').name + " Version:", require('./package.json').version , "rev:", require('./package.json').rev)
        this.parseData.parse(this.config)
        break
      case "START":
        this.parseData.start()
        break
      case "STOP":
        this.parseData.stop()
        break
    }
  }
});
