"use strict"

/** parse data from MagicMirror **/
var _load = require("../components/loadLibraries.js")
var logBring = (...args) => { /* do nothing */ }

class parseData {
  constructor(that) {
    this.sendSocketNotification = (...args) => that.sendSocketNotification(...args)
    this.lib = { error: 0 }
    this.config = {}
    this.running= false
    this.currentInterval= null
    this.intervalTime= 60000
    this.updater = null
  }
  
  async parse(config) {
    this.config = config
    if (this.config.debug) logBring = (...args) => { console.log("[BRING] [DATA]", ...args) }
    this.config.language = await this.languageConfig()
    console.log("[BRING] [DATA] Language set to:", this.config.language)
    let bugsounet = await _load.libraries(this)
    if (bugsounet) {
      console.error("[BRING] [DATA] Warning:", bugsounet, "needed library not loaded !")
      return
    }
    this.updater= new this.lib.bring.BringUpdater(this.lib)
    this.sendSocketNotification("INITIALIZED")
  }
  
  start() {
    this.updater.register(this.config)
    this.intervalTime = Math.max(30000, this.config.updateInterval)
    this.stopLoop()
    this.ensureLoop()
  }

  stop() {
    this.updater.unregister(this.config)
    if (!this.updater.hasJobs()) {
      this.stopLoop()
    }
  }

  stopLoop () {
    if (this.running) {
      logBring("Stop.")
      clearInterval(this.currentInterval)
      this.running = false
      this.currentInterval = null
    }
  }

  ensureLoop () {
    if (!this.running) {
      logBring("Starting.")
      this.running = true
      this.updater.refreshLists(list => {
        this.sendSocketNotification("UPDATE", list)
      })
      this.currentInterval = setInterval(() => {
        this.updater.refreshLists(list => {
          this.sendSocketNotification("UPDATE", list)
        })
      }, this.intervalTime)
    }
  }

  languageConfig () {
    let langDB= {
      0: "fr-FR",
      1: "de-AT",
      2: "de-CH",
      3: "de-DE",
      4: "es-ES",
      5: "en-GB",
      6: "en-US",
      7: "en-CA",
      8: "en-AU",
      9: "fr-CH",
      10: "fr-FR",
      11: "it-CH",
      12: "it-IT",
      13: "pt-BR",
      14: "nl-NL",
      15: "hu-HU",
      16: "nb-NO",
      17: "pl-PL",
      18: "ru-RU",
      19: "sv-SE",
      20: "tr-TR"
    }
    if (this.config.lang === 0) return "fr-FR"
    else if (!this.config.lang || isNaN(this.config.lang) || (this.config.lang > Object.keys(langDB).length-1) || (this.config.lang < 0)) {
      console.error("[BRING] [DATA] Mismake on config lang... set to fr-Fr")
      return "fr-FR"
    }

    return new Promise(resolve => {
      Object.entries(langDB).some(entry => {
        const [number,key] = entry
        if (this.config.lang == number) {
          resolve(key)
          return key // stop process if match
        }
      })
    })
  }
}

module.exports = parseData
