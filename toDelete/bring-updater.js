"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BringUpdater = void 0;
var bring_profile_1 = require("./bring-profile");
var BringUpdater = /** @class */ (function () {
    function BringUpdater() {
        this.bringProfiles = [];
        this.queryJobs = [];
    }
    BringUpdater.prototype.hasJobs = function () {
        return this.queryJobs.length > 0;
    };
    BringUpdater.prototype.register = function (config, logger) {
        this.logger = logger;
        var profile = null;
        var job = null;
        var matchProfiles = this.bringProfiles.filter(function (j) { return j.email === config.email; });
        var matchJobs = this.queryJobs.filter(function (j) { return j.email === config.email; });
        if (matchProfiles.length > 0) {
            profile = matchProfiles[0];
        }
        else {
            profile = new bring_profile_1.BringProfile(config.email, config.password, config.language, this.logger);
            this.bringProfiles.push(profile);
        }
        if (matchJobs.length > 0) {
            job = matchJobs[0];
            if (job.listsToTrack.filter(function (n) { return n.listName == config.listname; }).length == 0) {
                job.listsToTrack.push({ listName: config.listname, hash: '' });
            }
            else {
                job.listsToTrack.filter(function (n) { return n.listName == config.listname; })[0].hash = '';
            }
        }
        else {
            job = { email: config.email, listsToTrack: [{ listName: config.listname, hash: '' }] };
            this.queryJobs.push(job);
        }
    };
    BringUpdater.prototype.unregister = function (config) {
        var matchJobs = this.queryJobs.filter(function (j) { return j.email === config.email; });
        if (matchJobs.length > 0) {
            var job = matchJobs[0];
            if (job.listsToTrack.filter(function (n) { return n.listName === config.listname; }).length > 0) {
                job.listsToTrack = job.listsToTrack.filter(function (n) { return n.listName !== config.listname; });
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
                            _this.logger.log("List content has changed since last interval. Refreshing view.", false);
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
