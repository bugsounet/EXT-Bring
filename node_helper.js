"use strict";
/* Magic Mirror
 * Node Helper: bringList
 *
 * By Robert Seidt
 * MIT Licensed.
 */
var NodeHelper = require("node_helper");
var bring = require("./lib/bring-lib");

module.exports = NodeHelper.create({
  updater: new bring.BringUpdater(),
  running: false,
  currentInterval: null,
  intervalTime: 60000,
  logger: null,
  socketNotificationReceived: function (notification, payload) {
    if (notification === "bringList-REGISTER") {
      this.logger = new bring.BringLogger(payload);
      this.logger.log("Received registration notification.", true);
      this.updater.register(payload, this.logger);
      this.intervalTime = Math.max(30000, payload.updateInterval);
      this.stopLoop();
      this.ensureLoop();
    }
    if (notification === "bringList-SUSPEND") {
      this.logger.log("Received suspend notification.", true);
      this.updater.unregister(payload);
      if (!this.updater.hasJobs()) {
        this.stopLoop();
      }
    }
  },
  stopLoop: function () {
    if (this.running) {
      this.logger.log("Loop running. Stopping.", true);
      clearInterval(this.currentInterval);
      this.running = false;
      this.currentInterval = null;
    }
  },
  ensureLoop: function () {
    var _this = this;
    if (!this.running) {
      this.logger.log("Loop not running. Starting.", true);
      this.running = true;
      this.updater.refreshLists(function (l) {
        _this.sendSocketNotification("bringList-LISTUPDATE", l);
      });
      this.currentInterval = setInterval(function () {
        _this.updater.refreshLists(function (l) {
          _this.sendSocketNotification("bringList-LISTUPDATE", l);
        });
      }, this.intervalTime);
    }
  },

  stop: function () {
    this.stopLoop();
  }
});
