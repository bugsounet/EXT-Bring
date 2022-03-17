/* global Module */
Module.register("EXT-Bring", {
  defaults: {
    debug: false,
    listname: "",
    email: "",
    password: "",
    columns: 4,
    maxrows: 4,
    updateInterval: 60000,
    verboseLogging: false,
    language: "fr-FR"
    /**
     Valid locales:
        de-AT
        de-CH
        de-DE
        es-ES
        en-GB
        en-US
        en-CA
        en-AU
        fr-CH
        fr-FR
        it-CH
        it-IT
        pt-BR
        nl-NL
        hu-HU
        nb-NO
        pl-PL
        ru-RU
        sv-SE
        tr-TR
    **/
  },
  listData: null,
  requiresVersion: "2.18.0",
  start: function () {
    this.sendSocketNotification("bringList-REGISTER", this.config)
  },
  socketNotificationReceived: function (notification, payload) {
    if (notification === "bringList-LISTUPDATE") {
      // set dataNotification
      if (payload.listName.toLowerCase() === this.config.listname.toLowerCase()) {
        this.listData = payload
        this.updateDom(100)
      }
    }
    if (notification == "ALL_MODULES_STARTED") {
      this.updateDom()
    }
  },
  getDom: function () {
    var htmlTemplate = "\n\t\t<div class=\"bringitemcontainer\">\n\t\t\t<div class=\"bringitem\">\n\t\t\t\t<div class=\"itemupper\">\n\t\t\t\t\t<div class=\"indicators-container\"></div>\n\t\t\t\t\t<div class=\"image-container\">\n\t\t\t\t\t\t<img src=\"{iconUrl}\" class=\"itemimage\"/>\n\t\t\t\t\t</div>\n\t\t\t\t\t<div class=\"indicators-container\"></div>\n\t\t\t\t</div>\n\t\t\t\t<div class=\"itemlower\">\n\t\t\t\t\t<div class=\"itemtext-name bright\">{itemName}</div>\n\t\t\t\t\t<div class=\"itemtext-spec normal\">{itemSpec}</div>\n\t\t\t\t</div>\n\t\t\t</div>\n\t\t</div>"
    var self = this
    // create element wrapper for show into the module
    var wrapper = document.createElement("div")
    // If this.dataRequest is not empty
    var width = (self.config.columns * 101) + 1
    var height = (self.config.maxrows * 119)
    var lastrowstartpercent = Math.round(((self.config.maxrows - 1) / self.config.maxrows) * 100)
    var contentHtml = '<div style="max-width:' + width + 'px;max-height:' + height + 'px;position:relative;overflow-y:hidden;">'
    if (self.listData) {
      var listContent = self.listData
      listContent.items.forEach(function (element) {
        var itemHtml = htmlTemplate
          .replace(/\{iconUrl\}/g, element.imagePath)
          .replace(/\{itemName\}/g, element.localName)
          .replace(/\{itemSpec\}/g, element.specification);
        contentHtml += itemHtml;
      })
      wrapper.innerHTML = contentHtml
    }
    return wrapper
  },
  
  getStyles: function () {
    return [
      "mmm-bring-list.css",
    ]
  },

  suspend: function () {
    this.sendSocketNotification("bringList-SUSPEND", this.config)
  },
  
  resume: function () {
    this.sendSocketNotification("bringList-REGISTER", this.config)
  }
});
