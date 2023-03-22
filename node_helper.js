"use strict";
/** Magic Mirror
 * Node Helper: EXT-Bring
 *
 * By Robert Seidt
 * modified by @bugsounet
 * MIT Licensed.
 **/

var NodeHelper = require("node_helper");
var bring = require("./lib/bring-lib");
var logBring = (...args) => { /* do nothing */ }

module.exports = NodeHelper.create({
  start: function () {
    this.updater= new bring.BringUpdater()
    this.running= false
    this.currentInterval= null
    this.intervalTime= 60000
  },

  socketNotificationReceived: function (notification, payload) {
    switch (notification) {
      case "INIT":
        this.config = payload
        if (payload.debug) logBring = (...args) => { console.log("[BRING]", ...args) }
        console.log("[BRING] " + require('./package.json').name + " Version:", require('./package.json').version , "rev:", require('./package.json').rev)
        this.initialize()
        break
      case "EXT-Bring-REGISTER":
        logBring("Received registration demand.")
        this.initialize()
        break
      case "EXT-Bring-SUSPEND":
        logBring("Suspended.")
        this.updater.unregister(this.config)
        if (!this.updater.hasJobs()) {
          this.stopLoop()
        }
        break
    }
  },

  initialize: function() {
    this.updater.register(this.config)
    this.intervalTime = Math.max(30000, this.config.updateInterval)
    this.stopLoop()
    this.ensureLoop()
  },

  stopLoop: function () {
    if (this.running) {
      logBring("Stop.")
      clearInterval(this.currentInterval)
      this.running = false
      this.currentInterval = null
    }
  },

  ensureLoop: function () {
    if (!this.running) {
      logBring("Starting.")
      this.running = true
      this.updater.refreshLists(l => {
        this.sendSocketNotification("EXT-Bring-LISTUPDATE", l)
      })
      this.currentInterval = setInterval(() => {
        this.updater.refreshLists(l => {
          this.sendSocketNotification("EXT-Bring-LISTUPDATE", l)
        })
      }, this.intervalTime)
    }
  },

  stop: function () {
    this.stopLoop()
  }
});
