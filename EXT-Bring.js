/* global Module */

Module.register("EXT-Bring", {
  defaults: {
    debug: false,
    listName: "",
    email: "",
    password: "",
    lang: 0,
    columns: 4,
    maxRows: 4,
    showBackground: true,
    showBox: true,
    showListName: true,
    updateInterval: 30000
  },

  requiresVersion: "2.18.0",

  start: async function () {
    this.listData= null
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
    }
    this.config.language = await this.languageConfig()
    console.warn("[BRING] Language set to:", this.config.language)
  },

  languageConfig: function () {
    if (this.config.lang === 0) return "fr-FR"
    else if (!this.config.lang || isNaN(this.config.lang) || (this.config.lang > Object.keys(this.langDB).length-1) || (this.config.lang < 0)) {
      console.warn("[BRING] Mismake on config lang...")
      return "fr-FR"
    }

    return new Promise(resolve => {
      Object.entries(this.langDB).some(entry => {
        const [number,key] = entry
        if (this.config.lang == number) {
          resolve(key)
          return key // stop process if match
        }
      })
    })
  },

  notificationReceived: function(notification, payload, sender) {
    switch (notification) {
      case "DOM_OBJECTS_CREATED":
        this.sendSocketNotification("INIT", this.config)
        break
      case "GAv5_READY":
        if (sender.name == "MMM-GoogleAssistant") this.sendNotification("EXT_HELLO", this.name)
        break
      case "EXT_BRING-START":
        this.sendSocketNotification("EXT-Bring-START")
        break
      case "EXT_BRING-STOP":
        this.sendSocketNotification("EXT-Bring-STOP")
        break
    }
  },

  socketNotificationReceived: function (notification, payload) {
    if (notification === "EXT-Bring-LISTUPDATE") {
      if (payload.listName.toLowerCase() === this.config.listName.toLowerCase()) {
        this.listData = payload
        if (this.config.showListName) this.data.header = payload.listName
        this.updateDom(400)
      }
    }
  },

  getStyles: function () {
    return [
      "EXT-Bring.css"
    ]
  },

  getDom: function () {
    var Bring = document.createElement("div")
    Bring.id = "EXT-Bring"
    Bring.style.maxWidth= ((this.config.columns * 101) + 1) + "px"
    Bring.style.maxHeight= this.config.maxRows * 119 + "px"

    if (this.listData) {
      var listContent = this.listData
      listContent.items.forEach(element => {

        var BringContener= document.createElement("div")
        BringContener.id = "EXT-Bring_Contener"
        if (this.config.showBackground) BringContener.classList.add("background")
        if (this.config.showBox) BringContener.classList.add("box")
        Bring.appendChild(BringContener)

        var BringItem= document.createElement("div")
        BringItem.id = "EXT-Bring_Item"
        BringContener.appendChild(BringItem)

        // Upper

        var BringItemUpper= document.createElement("div")
        BringItemUpper.id = "EXT-Bring_Item-Upper"
        BringItem.appendChild(BringItemUpper)

        var BringIndicatorsLeft= document.createElement("div")
        BringIndicatorsLeft.id = "EXT-Bring_Indicators"
        BringItemUpper.appendChild(BringIndicatorsLeft)

        var BringImageContener= document.createElement("div")
        BringImageContener.id = "EXT-Bring_ImageContener"
        BringItemUpper.appendChild(BringImageContener)

        var BringImage= document.createElement("img")
        BringImage.id = "EXT-Bring_Image"
        BringImage.src = element.imagePath
        BringImageContener.appendChild(BringImage)

        var BringIndicatorsRight= document.createElement("div")
        BringIndicatorsRight.id = "EXT-Bring_Indicators"
        BringItemUpper.appendChild(BringIndicatorsRight)

        // Lower

        var BringItemLower= document.createElement("div")
        BringItemLower.id = "EXT-Bring_Item-Lower"
        BringItem.appendChild(BringItemLower)

        var BringTextName= document.createElement("div")
        BringTextName.id = "EXT-Bring_TextName"
        BringTextName.textContent = element.localName
        BringItemLower.appendChild(BringTextName)

        var BringTextSpec= document.createElement("div")
        BringTextSpec.id = "EXT-Bring_TextSpec"
        BringTextSpec.textContent = element.specification
        BringItemLower.appendChild(BringTextSpec)

      })
    }
    return Bring
  }
});
