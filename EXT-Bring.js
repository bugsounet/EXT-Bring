/* global Module */

Module.register("EXT-Bring", {
  requiresVersion: "2.25.0",
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

  start: async function () {
    this.listData= null
  },

  notificationReceived: function(notification, payload, sender) {
    switch (notification) {
      case "GA_READY":
        if (sender.name === "MMM-GoogleAssistant") {
          this.sendSocketNotification("INIT", this.config)
        }
        break
      case "EXT_BRING-START": // can be used with Gateway/EXT-Screen later
        this.sendSocketNotification("START")
        break
      case "EXT_BRING-STOP": // can be used with Gateway/EXT-Screen later
        this.sendSocketNotification("STOP")
        break
    }
  },

  socketNotificationReceived: function (notification, payload) {
    switch (notification) {
      case "INITIALIZED":
        this.sendNotification("EXT_HELLO", this.name)
        break
      case "UPDATE":
        if (payload.listName.toLowerCase() === this.config.listName.toLowerCase()) {
          this.listData = payload
          if (this.config.showListName) this.data.header = payload.listName
          this.updateDom(400)
        }
        break
    }
  },

  getStyles: function () {
    return [ "EXT-Bring.css" ]
  },

  getDom: function () {
    var Bring = document.createElement("div")
    Bring.id = "EXT-Bring"
    Bring.style.maxWidth= ((this.config.columns * 101) + 1) + "px"
    Bring.style.maxHeight= this.config.maxRows * 119 + "px"

    if (this.listData) {
      this.listData.items.forEach(element => {
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
