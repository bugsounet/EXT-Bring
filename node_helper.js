"use strict";
/** Magic Mirror
 * Node Helper: EXT-Bring
 *
 * By Robert Seidt
 * modified by @bugsounet
 * MIT Licensed.
 **/

/** todo: review code in deep
 * apply @bugsounet style
 * add EXT Compatibility
 **/

var NodeHelper = require("node_helper");
var bring = require("./lib/bring-lib");
var logBring = (...args) => { /* do nothing */ }

module.exports = NodeHelper.create({
  updater: new bring.BringUpdater(),
  running: false,
  currentInterval: null,
  intervalTime: 60000,

  socketNotificationReceived: function (notification, payload) {
    if (notification === "bringList-REGISTER") {
      if (payload.debug) logBring = (...args) => { console.log("[BRING]", ...args) }
      logBring("Received registration notification.")
      this.updater.register(payload)
      this.intervalTime = Math.max(30000, payload.updateInterval)
      this.stopLoop()
      this.ensureLoop()
    }
    if (notification === "bringList-SUSPEND") {
      logBring("Received suspend notification.")
      this.updater.unregister(payload)
      if (!this.updater.hasJobs()) {
        this.stopLoop()
      }
    }
  },

  stopLoop: function () {
    if (this.running) {
      logBring("Loop running. Stopping.")
      clearInterval(this.currentInterval)
      this.running = false
      this.currentInterval = null
    }
  },

  ensureLoop: function () {
    if (!this.running) {
      logBring("Loop not running. Starting.")
      this.running = true
      this.updater.refreshLists(l => {
        this.sendSocketNotification("bringList-LISTUPDATE", l)
      })
      this.currentInterval = setInterval(() => {
        this.updater.refreshLists(l => {
          this.sendSocketNotification("bringList-LISTUPDATE", l)
        })
      }, this.intervalTime)
    }
  },

  stop: function () {
    this.stopLoop()
  }
});
