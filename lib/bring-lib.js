/** bring library
 * by Robert Seidt
 * modified by @bugsounet
 **/

"use strict";

var request = require("request");
var ts_md5 = require("ts-md5");

/** Profile **/
var BringProfile = /** @class */ (function () {
  function BringProfile(email, password, language, logger) {
    this.authUrl = "https://api.getbring.com/rest/v2/bringauth";
    this.listUrl = "https://api.getbring.com/rest/v2/bringlists/{listId}";
    this.listsForUserUrl = "https://api.getbring.com/rest/v2/bringusers/{userid}/lists";
    this.listItemDetailsUrl = "https://api.getbring.com/rest/v2/bringlists/{listId}/details";
    this.catalogUrl = `https://web.getbring.com/locale/catalog.${language}.json`;
    this.articleLocalizationUrl = `https://web.getbring.com/locale/articles.${language}.json`;
    this.imagePathTemplate = "https://web.getbring.com/assets/images/items/{filename}";
    this.catalog = null;
    this.articleLocalization = null;
    this.userLists = [];
    this.email = email;
    this.password = password;
    this.logger = logger;
  }
  BringProfile.prototype.requestGetOptions = function () {
    return {
      json: true,
      headers: {
        'Authorization': "Bearer " + this.access_token,
        'X-BRING-COUNTRY': 'DE',
        'X-BRING-USER-UUID': this.userid,
        'X-BRING-API-KEY': 'cof4Nc6D8saplXjE3h3HXqHH8m7VU2i1Gs0g85Sp' //Konstante in Brings Environment-Konfig (steht im main bundle auf deren webseite). Möglicherweise ändert es sich regelmäßig. Bleibt abzuwarten.
      }
    };
  };
  BringProfile.prototype.getListsForUser = function (callback, retryNo) {
    var _this = this;
    if (retryNo === void 0) { retryNo = 0; }
    request.get(this.listsForUserUrl.replace(/\{userid\}/g, this.userid), this.requestGetOptions(), function (err, res, response) {
      if (err) {
        if (retryNo < 3) {
          setTimeout(function () { _this.getListsForUser(callback, ++retryNo); }, 1000);
        }
        else {
          _this.logger.logError("Unexpected error connecting to bringList: " + err + ". Hopefully temporary. Will retry in 30 minutes.");
          setTimeout(function () { _this.getListsForUser(callback); }, 1800000);
        }
      }
      else if (res && res.statusCode != 200) {
        _this.logger.logError("Received unexpected status code from bring server when loading Lists for User: " + res.statusCode);
      }
      else {
        if (response.lists) {
          response.lists.forEach(function (item) {
            if (_this.userLists.filter(function (l) { return l.listId === item.listUuid; }).length === 0) {
              _this.userLists.push({ hash: '', items: [], listId: item.listUuid, listName: item.name });
            }
          });
          callback();
        }
        else {
          _this.logger.logError("Could not find 'lists' Element in Response from bring: " + JSON.stringify(response));
        }
      }
    });
  };
  BringProfile.prototype.initializeCatalog = function (callback, retryNo) {
    var _this = this;
    if (retryNo === void 0) { retryNo = 0; }
    request.get({ url: this.catalogUrl, json: true, rejectUnauthorized: false }, function (err, res, body) {
      if (err) {
        if (retryNo < 3) {
          setTimeout(function () { _this.initializeCatalog(callback, ++retryNo); }, 1000);
        }
        else {
          _this.logger.logError("Unexpected error during download of Catalog: " + err + ". Hopefully temporary. Will retry in 30 minutes.");
          setTimeout(function () { _this.initializeCatalog(callback); }, 1800000);
        }
      }
      else {
        _this.catalog = body.catalog;
        callback();
      }
    });
  };
  BringProfile.prototype.initializeArticleLocalization = function (callback, retryNo) {
    var _this = this;
    if (retryNo === void 0) { retryNo = 0; }
    this.articleLocalization = [];
    request.get({ url: this.articleLocalizationUrl, json: true, rejectUnauthorized: false }, function (err, res, body) {
      if (err) {
        if (retryNo < 3) {
          setTimeout(function () { _this.initializeArticleLocalization(callback, ++retryNo); }, 1000);
        }
        else {
          _this.logger.logError("Unexpected error during download of ArticleLocalization: " + err + ". Hopefully temporary. Will retry in 30 minutes.");
          setTimeout(function () { _this.initializeArticleLocalization(callback); }, 1800000);
        }
      }
      for (var key in body) {
        if (Object.prototype.hasOwnProperty.call(body, key)) {
          var val = body[key];
          _this.articleLocalization.push({ key: key, value: val });
        }
      }
      callback();
    });
  };
  BringProfile.prototype.login = function (callback, retryNo) {
    var _this = this;
    if (retryNo === void 0) { retryNo = 0; }
    var authenticationperformed = false;
    if (!this.articleLocalization) {
      this.initializeArticleLocalization(function () {
        if (_this.catalog && authenticationperformed) {
          callback();
        }
      });
    }
    if (!this.catalog) {
      this.initializeCatalog(function () {
        if (_this.articleLocalization && authenticationperformed) {
          callback();
        }
      });
    }
    request.post({ url: this.authUrl, form: { email: this.email, password: this.password } }, function (err, res, body) {
      if (err) {
        if (retryNo < 3) {
          _this.login(callback, ++retryNo);
        }
        else {
          _this.logger.logError("Unexpected error when connecting to bring server: " + err + ". Hopefully temporary. Will retry in 30 minutes.");
          setTimeout(function () { _this.login(callback); }, 1800000);
        }
      }
      else if (res && res.statusCode == 401) {
        _this.logger.logError("Could not authenticate to bringList.");
      }
      else {
        var result = JSON.parse(body);
        _this.access_token = result.access_token;
        _this.userid = result.uuid;
        _this.getListsForUser(function () {
          if (_this.articleLocalization && _this.catalog) {
            callback();
          }
        });
      }
    });
  };
  BringProfile.prototype.loadList = function (listName, done) {
    var _this = this;
    if (!this.access_token || !this.catalog || !this.articleLocalization) {
      this.login(function () { return _this.executeListFetch(listName, done); });
    }
    else {
      this.executeListFetch(listName, done);
    }
  };
  BringProfile.prototype.executeListFetch = function (listName, done) {
    var list = this.userLists.filter(function (l) { return l.listName === listName; })[0];
    if (list && list.listId) {
      this.fetchList(list.listId, true, done);
    }
    else {
      this.logger.logError('A list with the name "' + listName + '" does not exist in your user Profile. We found the following lists: ' + this.userLists.map(function (l) { return l.listName; }).join(', '));
    }
  };
  BringProfile.prototype.fetchList = function (listId, reauthenticate, done, retryNo) {
    var _this = this;
    if (retryNo === void 0) { retryNo = 0; }
    if (!this.access_token && reauthenticate) {
      this.login(function () { _this.fetchList(listId, false, done); });
    }
    else {
      request.get(this.listUrl.replace(/\{listId\}/, listId), this.requestGetOptions(), function (err, res, response) {
        if (err) {
          if (retryNo < 3) {
            setTimeout(function () { _this.fetchList(listId, reauthenticate, done, ++retryNo); }, 1000);
          }
          else {
            _this.logger.logError("Unexpected error when connecting to bring server: " + err + ". Hopefully temporary. Will retry in 30 minutes.");
            setTimeout(function () { _this.fetchList(listId, reauthenticate, done); }, 1800000);
          }
        }
        else if (res && res.statusCode == 401 && reauthenticate) {
          _this.login(function () { _this.fetchList(listId, false, done); });
        }
        else if (res && res.statusCode != 200) {
          _this.logger.logError("Received unexpected status code from bring server: " + res.statusCode);
        }
        else {
          var list = _this.userLists.filter(function (l) { return l.listId === listId; })[0];
          list.items = [];
          response.purchase.forEach(function (element) {
            list.items.push({ name: element.name, localName: _this.getLocalName(element.name), specification: element.specification, iconFileName: "", iconId: "", sectionId: "", imagePath: "" });
          });
          var hashbase = JSON.stringify({ items: list.items, head: list.listName + list.listId });
          var newHash = ts_md5.Md5.hashStr(hashbase);
          list.hash = newHash;
          done(list);
        }
      });
    }
  };
  BringProfile.prototype.getListDetail = function (list, callback, retryNo) {
    var _this = this;
    if (retryNo === void 0) { retryNo = 0; }
    request.get(this.listItemDetailsUrl.replace(/\{listId\}/, list.listId), this.requestGetOptions(), function (err, res, response) {
      if (err) {
        if (retryNo < 3) {
          window.setTimeout(function () { _this.getListDetail(list, callback, ++retryNo); }, 1000);
        }
        else {
          _this.logger.logError("Unexpected error when connecting to bring server: " + err + ". Hopefully temporary. Will retry in 30 minutes.");
          window.setTimeout(function () { _this.getListDetail(list, callback); }, 1800000);
        }
      }
      else if (res && res.statusCode != 200) {
        _this.logger.logError("Received unexpected status code from bring server: " + res.statusCode);
      }
      else {
        list.items.forEach(function (listItem) {
          response.forEach(function (detailElement) {
            if (listItem.name == detailElement.itemId) {
              listItem.iconId = detailElement.userIconItemId;
              listItem.sectionId = detailElement.userSectionId;
            }
          });
          _this.setIconUrl(listItem);
        });
        _this.logger.log("reporting new list", true);
        callback(list);
      }
    });
  };
  BringProfile.prototype.getImagePath = function (imageId) {
    var filename = imageId.toLowerCase()
      .replace(' ', '_')
      .replace('ü', 'ue')
      .replace('ä', 'ae')
      .replace('ö', 'oe')
      .replace('é', 'e')
      .replace('ß', 'ss')
      .replace('-', '_');
    filename = filename + ".png";
    filename = this.imagePathTemplate.replace(/\{filename\}/g, filename);
    return filename;
  };
  BringProfile.prototype.getLocalName = function (elementName) {
    var matchArticles = this.articleLocalization.filter(function (l) { return l.key == elementName; });
    if (matchArticles.length > 0)
      return matchArticles[0].value;
    else
      return elementName;
  };
  BringProfile.prototype.setIconUrl = function (listItem) {
    var lookupId = "";
    var sectionId = "";
    if (listItem.iconId) {
      lookupId = listItem.iconId;
    }
    if (listItem.sectionId) {
      sectionId = listItem.sectionId;
    }
    if (!lookupId) {
      lookupId = listItem.name;
    }
    this.setImageToItem(sectionId, lookupId, listItem);
  };
  BringProfile.prototype.setImageToItem = function (sectionId, lookupId, listItem) {
    var lookupItems = [];
    if (sectionId) {
      lookupItems = this.catalog.sections.filter(function (s) { return s.sectionId == sectionId; })[0].items;
    }
    else {
      this.catalog.sections.forEach(function (s) { return s.items.forEach(function (it) { return lookupItems.push(it); }); });
    }
    if (lookupItems.filter(function (i) { return i.itemId == lookupId; }).length > 0) {
      listItem.imagePath = this.getImagePath(lookupId);
    }
    else {
      listItem.imagePath = this.getImagePath(listItem.name.toLowerCase().substr(0, 1));
    }
  };
  return BringProfile;
}());
exports.BringProfile = BringProfile;

/** Log **/
var BringLogger = /** @class */ (function () {
  function BringLogger(config) {
    this.config = config;
  }
  BringLogger.prototype.log = function (message, verbose) {
    if (!verbose || this.config.debug) {
      console.log("[BRING] " + message);
    }
  };
  BringLogger.prototype.logError = function (message) {
    console.error("[BRING] " + message);
  };
  return BringLogger;
}());
exports.BringLogger = BringLogger;

/** Updater **/
var BringUpdater = /** @class */ (function () {
  function BringUpdater() {
    this.bringProfiles = [];
    this.queryJobs = [];
  }
  BringUpdater.prototype.hasJobs = function () {
    return this.queryJobs.length > 0;
  };
  BringUpdater.prototype.register = function (config) {
    this.logger = new BringLogger(config);
    var profile = null;
    var job = null;
    var matchProfiles = this.bringProfiles.filter(function (j) { return j.email === config.email; });
    var matchJobs = this.queryJobs.filter(function (j) { return j.email === config.email; });
    if (matchProfiles.length > 0) {
      profile = matchProfiles[0];
    }
    else {
      profile = new BringProfile(config.email, config.password, config.language, this.logger);
      this.bringProfiles.push(profile);
    }
    if (matchJobs.length > 0) {
      job = matchJobs[0];
      if (job.listsToTrack.filter(function (n) { return n.listName == config.listName; }).length == 0) {
        job.listsToTrack.push({ listName: config.listName, hash: '' });
      }
      else {
        job.listsToTrack.filter(function (n) { return n.listName == config.listName; })[0].hash = '';
      }
    }
    else {
      job = { email: config.email, listsToTrack: [{ listName: config.listName, hash: '' }] };
      this.queryJobs.push(job);
    }
  };
  BringUpdater.prototype.unregister = function (config) {
    var matchJobs = this.queryJobs.filter(function (j) { return j.email === config.email; });
    if (matchJobs.length > 0) {
      var job = matchJobs[0];
      if (job.listsToTrack.filter(function (n) { return n.listName === config.listName; }).length > 0) {
        job.listsToTrack = job.listsToTrack.filter(function (n) { return n.listName !== config.listName; });
      }
      if (job.listsToTrack.length == 0) {
        this.queryJobs = this.queryJobs.filter(function (j) { return j.email !== config.email; });
      }
    }
  };
  BringUpdater.prototype.refreshLists = function (onlistupdate) {
    var _this = this;
    this.logger.log("Starting List update...", true);
    this.queryJobs.forEach(function (job) {
      if (job.listsToTrack && job.listsToTrack.length > 0) {
        var profile = _this.bringProfiles.filter(function (p) { return p.email === job.email; })[0];
        job.listsToTrack.forEach(function (list) {
          profile.loadList(list.listName, function (l) {
            if (l.hash != list.hash) {
              _this.logger.log("Refresh Bring!", false);
              profile.getListDetail(l, function (detailedList) {
                list.hash = l.hash;
                _this.logger.log("Passing Updated List to helper.", true);
                onlistupdate(detailedList);
              });
            }
          });
        });
      }
    });
  };
  return BringUpdater;
}());
exports.BringUpdater = BringUpdater;
