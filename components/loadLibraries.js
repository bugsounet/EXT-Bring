"use strict"

/** Load sensible library without black screen **/
var logBring = (...args) => { /* do nothing */ }

function libraries(that) {
  if (that.config.debug) logBring = (...args) => { console.log("[BRING] [LIB]", ...args) }
  let libraries= [
    // { "library to load" : "store library name" }
    { "../components/bring-lib.js": "bring" },
    { "ts-md5" : "tsMd5" },
    { "https" : "https" },
    { "fetch" : "fetch" }
  ]
  let errors = 0
  return new Promise(resolve => {
    libraries.forEach(library => {
      for (const [name, configValues] of Object.entries(library)) {
        let libraryToLoad = name
        let libraryName = configValues

        try {
          if (!that.lib[libraryName]) {
            that.lib[libraryName] = require(libraryToLoad)
            logBring("Loaded:", libraryToLoad, "->", "this.lib."+libraryName)
          }
        } catch (e) {
          console.error("[BRING] [LIB]", libraryToLoad, "Loading error!" , e.toString(), e)
          that.sendSocketNotification("WARNING" , {library: libraryToLoad })
          errors++
          that.lib.error = errors
        }
      }
    })
    resolve(errors)
    console.log("[BRING] [LIB] All libraries loaded!")
  })
}

exports.libraries = libraries
