"use strict";
/**
 * Node Helper: EXT-Bring
 *
 * By Robert Seidt
 * modified by @bugsounet
 * MIT Licensed.
 **/

var NodeHelper = require("node_helper");

var logBring = (...args) => { /* do nothing */ };

module.exports = NodeHelper.create({
  start () {
    this.lib = { error: 0 };
    this.config = {};
    this.running= false;
    this.currentInterval= null;
    this.intervalTime= 60000;
    this.updater = null;
    this.langDB= {
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
    };
  },

  socketNotificationReceived (notification, payload) {
    switch (notification) {
      case "INIT":
        this.config = payload;
        if (this.config.debug) logBring = (...args) => { console.log("[BRING]", ...args); };
        console.log(`[BRING] ${require("./package.json").name} Version:`, require("./package.json").version , "rev:", require("./package.json").rev);
        this.parse();
        break;
      case "START":
        this.startBring();
        break;
      case "STOP":
        this.stopBring();
        break;
    }
  },

  async parse () {
    this.config.language = await this.languageConfig();
    console.log(`[BRING] [DATA] Language set to: ${this.config.language}`);
    let bugsounet = await this.libraries();
    if (bugsounet) {
      console.error(`[BRING] [DATA] Warning: ${bugsounet} needed library not loaded !`);
      this.sendSocketNotification("ERROR", `${bugsounet} needed library not loaded !`);
      return;
    }
    this.updater= new this.lib.bring.BringUpdater(this.lib);
    this.sendSocketNotification("INITIALIZED");
  },

  languageConfig () {
    if (this.config.lang === 0) return "fr-FR";
    if (typeof(this.config.lang) !== "number") {
      console.error("[BRING] [DATA] Mistake on config lang (must be a number) -> set language to fr-Fr");
      this.sendSocketNotification("ERROR", "Mistake on config lang (must be a number) -> set language to fr-Fr");
      return "fr-FR";
    }
    if ((this.config.lang > Object.keys(this.langDB).length-1) || (this.config.lang < 0)) {
      console.error(`[BRING] [DATA] Mistake on config lang [0 to ${Object.keys(this.langDB).length-1}]-> set language to fr-Fr`);
      this.sendSocketNotification("ERROR", `Mistake on config lang [0 to ${Object.keys(this.langDB).length-1}]-> set language to fr-Fr`);
      return "fr-FR";
    }

    return new Promise((resolve) => {
      Object.entries(this.langDB).some((entry) => {
        const [number,key] = entry;
        if (this.config.lang === parseInt(number)) {
          resolve(key);
          return key; // stop process if match
        }
      });
    });
  },

  libraries () {
    let libraries= [
      // { "library to load" : "store library name" }
      { "./components/bring-lib.js": "bring" },
      { "ts-md5" : "tsMd5" },
      { "node:https": "https" }
      
    ];
    let errors = 0;
    return new Promise((resolve) => {
      libraries.forEach((library) => {
        for (const [name, configValues] of Object.entries(library)) {
          let libraryToLoad = name;
          let libraryName = configValues;
  
          try {
            if (!this.lib[libraryName]) {
              this.lib[libraryName] = require(libraryToLoad);
              logBring("[BRING] [LIBRARIES] Loaded:", libraryToLoad, "->", `this.lib.${libraryName}`);
            }
          } catch (e) {
            console.error("[BRING] [LIBRARIES]", libraryToLoad, "Loading error!" , e.toString());
            this.sendSocketNotification("WARNING" , { library: libraryToLoad });
            errors++;
            this.lib.error = errors;
          }
        }
      });
      resolve(errors);
      if (!errors) console.log("[BRING] [LIBRARIES] All libraries loaded!");
    });
  },

  startBring () {
    this.updater.register(this.config);
    this.intervalTime = Math.max(30000, this.config.updateInterval);
    this.stopLoop();
    this.ensureLoop();
  },

  stopBring () {
    this.updater.unregister(this.config);
    if (!this.updater.hasJobs()) {
      this.stopLoop();
    }
  },

  stopLoop () {
    if (this.running) {
      logBring("Stop.");
      clearInterval(this.currentInterval);
      this.running = false;
      this.currentInterval = null;
    }
  },

  ensureLoop () {
    if (!this.running) {
      logBring("Starting.");
      this.running = true;
      this.updater.refreshLists((list) => {
        this.sendSocketNotification("UPDATE", list);
      });
      this.currentInterval = setInterval(() => {
        this.updater.refreshLists((list) => {
          this.sendSocketNotification("UPDATE", list);
        });
      }, this.intervalTime);
    }
  }
});
