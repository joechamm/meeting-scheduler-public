var fs = require('fs');
var crypto = require('crypto');
var mongoose = require('mongoose');
var MongoClient = require('mongodb').MongoClient;
var EntrepreneurModel = require('./schemas/entrepreneurModel.js');
var InvestorModel = require('./schemas/investorModel.js');
var Entrepreneur = require('./entrepreneur.js');
var Investor = require('./investor.js');
var OVERWRITE = true;
var meeting_times = ["9:00AM","9:40AM","10:20AM","11:00AM","12:40PM","1:20PM","2:00PM","2:40PM","3:20PM","4:00PM"];

var mongoDB;
var dbURI = 'mongodb://localhost:27017/cuRegistrations';
mongoose.connect(dbURI);
MongoClient.connect(dbURI, function (err, db) {
  if (err) {
    return console.error(err);
  }
  mongoDB = db;
});

function Scheduler () {
  this._db = mongoDB;
  this._investors = [];
  this._entrepreneurs = [];
	this._info = {};
	this._info.investors = {};
	this._info.entrepreneurs = {};
	this._info.investor_uids = {};
	this._info.entrepreneur_uids = {};
  this._rounds = new Array(10);
  for (var i = 0; i < 10; i++) {
    this._rounds[i] = {
      "time": meeting_times[i],
      "status": "NONE",
      "unscheduled": []
    };
  }
}

Scheduler.prototype.getStatus = function () {
  for (var i = 0; i < 10; i++) {
    if (this._rounds[i].status !== 'COMPLETE') {
      return 'INCOMPLETE';
    }
  }
  return 'COMPLETE';
};

// safe insert of entrepreneurs
Scheduler.prototype.setEntrepreneurs = function (entrepreneurs) {
  try {
    if (this._entrepreneurs.length > 0) {
      throw new Error('entrepreneurs array already filled!');
    }
    var that = this;
    entrepreneurs.forEach(function (elem, idx, arr) {
      var ename = elem.getName();
      var uid = elem.getUid();
      that._entrepreneurs.push(elem);
      that._info.entrepreneurs[ename] = {
        "index": idx
      };
      that._info.entrepreneur_uids[uid] = {
        "index": idx
      };
    });
    return true;
  } catch (e) {
    console.error(JSON.stringify(e, ['stack','message'],2));
    return false;
  }
};

// no check insert of entrepreneurs
Scheduler.prototype.resetEntrepreneurs = function (entrepreneurs) {
  var that = this;
  this._entrepreneurs = entrepreneurs;
  this._entrepreneurs.forEach(function (elem, idx, arr) {
    var ename = elem.getName();
    var uid = elem.getUid();
    that._info.entrepreneurs[ename] = {
      "index": idx
    };
    that._info.entrepreneur_uids[uid] = {
        "index": idx
      };
  });
  return true;
};

// safe insert of investors
Scheduler.prototype.setInvestors = function (investors) {
  try {
    if (this._investors.length > 0) {
      throw new Error('investors array already filled!');
    }
    var that = this;
    investors.forEach(function (elem, idx, arr) {
      var iname = elem.getName();
      var loc = elem.getLocation();
      var uid = elem.getUid();
      that._investors.push(elem);
      that._info.investors[iname] = {
        "index": idx,
        "location": loc
      };
      that._info.investor_uids[uid] = {
        "index": idx,
        "location": loc
      };
    });
    return true;
  } catch (e) {
    console.error(JSON.stringify(e, ['stack','message'],2));
    return false;
  }
};

// no check insert of investors
Scheduler.prototype.resetInvestors = function (investors) {
  var that = this;
  this._investors = investors;
  this._investors.forEach(function (elem, idx, arr) {
    var iname = elem.getName();
    var loc = elem.getLocation();
    var uid = elem.getUid();
    that._info.investors[iname] = {
      "index": idx,
      "location": loc
    };
    that._info.investor_uids[uid] = {
        "index": idx,
        "location": loc
      };
  });
  return true;
};

Scheduler.prototype.deleteEntrepreneurs = function () {
  var len = this._entrepreneurs.length;
  for (var i = 0; i < len; i++) {
    delete this._entrepreneurs[i];
  }

  for (var key in this._info.entrepreneurs) {
    delete this._info.entrepreneurs[key];
  }

  for (var key in this._info.entrepreneur_uids) {
    delete this._info.entrepreneur_uids[key];
  }

  this._entrepreneurs = [];
  this._info.entrepreneurs = {};
  this._info.entrepreneur_uids = {};
  return true;
};

Scheduler.prototype.deleteInvestors = function () {
  var len = this._investors.length;
  for (var i = 0; i < len; i++) {
    delete this._investors[i];
  }

  for (var key in this._info.investors) {
    delete this._info.investors[key];
  }

  for (var key in this._info.investor_uids) {
    delete this._info.investor_uids[key];
  }

  this._investors = [];
  this._info.investors = {};
  this._info.investor_uids = {};
  return true;
};

Scheduler.prototype.getInvestorByIndex = function (idx) {
  try {
    if (idx < 0 || idx >= this._investors.length) {
      throw "Index out of range";
    }
    return this._investors[idx];
  } catch (e) {
    console.error(JSON.stringify(e, ['stack','message'],2));
    return false;
  }
};

Scheduler.prototype.getInvestorByName = function (iname) {
	if (this.hasInvestor(iname)) {
		var idx = this._info.investors[iname].index;
		return this._investors[idx];
	}
  return false;
};

Scheduler.prototype.getInvestorFromUid = function (uid) {
  if (uid in this._info.investor_uids) {
    var idx = this._info.investor_uids[uid].index;
    return this._investors[idx];
  }
  return false;
};

Scheduler.prototype.getInvestorIndexByName = function (iname) {
	if (iname in this._info.investors) {
		return this._info.investors[iname].index;
	} else {
		for (var i = 0; i < this._investors.length; i++) {
			var investor = this._investors[i];
			var testName = investor.getName();
			if (testName === iname) {
				var loc = investor.getLocation();
				if (!loc) {
					loc = 'UNKNOWN';
				}
				this._info.investors[iname] = {
					"index": i,
					"location": loc
				};
				investor.setIndex(i);
				investor.setLocation(loc);
				return i;
			}
		}
	}
	return - 1;
};

Scheduler.prototype.getInvestorLocationByName = function (iname) {
	if (iname in this._info.investors) {
		return this._info.investors[iname].location;
	} else {
    for (var i = 0; i < this._investors.length; i++) {
      var investor = this._investors[i];
      var testName = investor.getName();
      if (testName === iname) {
        var loc = investor.getLocation();
        if (!loc) {
					loc = 'UNKNOWN';
				}
				this._info.investors[iname] = {
					"index": i,
					"location": loc
				};
				investor.setIndex(i);
				investor.setLocation(loc);
				return loc;
      }
    }
	}
	return 'UNKNOWN';
};

Scheduler.prototype.getInvestorLocationByUid = function (uid) {
	if (uid in this._info.investor_uids) {
		return this._info.investor_uids[uid].location;
	}
	return 'UNKNOWN';
};

Scheduler.prototype.hasInvestor = function (iname) {
	return (iname in this._info.investors);
};

Scheduler.prototype.getEntrepreneurByIndex = function (idx) {
  try {
    if (idx < 0 || idx >= this._entrepreneurs.length) {
      throw "Index out of range";
    }
    return this._entrepreneurs[idx];
  } catch (e) {
    console.error(JSON.stringify(e, ['stack','message'],2));
    return false;
  }
};

Scheduler.prototype.getEntrepreneurByName = function (ename) {
	if (this.hasEntrepreneur(ename)) {
		var idx = this._info.entrepreneurs[ename].index;
		return this._entrepreneurs[idx];
	}
  return false;
};

Scheduler.prototype.getEntrepreneurFromUid = function (uid) {
  if (uid in this._info.entrepreneur_uids) {
    var idx = this._info.entrepreneur_uids[uid].index;
    return this._entrepreneurs[idx];
  }
  return false;
};

Scheduler.prototype.getEntrepreneurIndexByName = function (ename) {
	if (ename in this._info.entrepreneurs) {
		return this._info.entrepreneurs[ename].index;
	} else {
		for (var i = 0; i < this._entrepreneurs.length; i++) {
			var entrepreneur = this._entrepreneurs[i];
			var testName = entrepreneur.getName();
			if (testName === ename) {
				this._info.entrepreneurs[ename] = {
					"index": i
				};
				entrepreneur.setIndex(i);
				return i;
			}
		}
	}
	return - 1;
};

Scheduler.prototype.hasEntrepreneur = function (ename) {
	return (ename in this._info.entrepreneurs);
};

Scheduler.prototype.addInvestor = function (investor) {
  try {
    if (!(investor instanceof Investor)) {
      throw "Invalid Investor Object";
    }
  	var invName = investor.getName();
  	if (this.hasInvestor(invName)) {
//  		throw "Duplicate Investor Name";
        return false;
  	}
  	var idx = investor.getIndex();
  	var len = this._investors.length;
  	if (idx === -1 || idx >= len) {
  		investor.setIndex(len);
  		this._investors.push(investor);
  	} else {
  		this._investors[idx] = investor;
  	}
  	var openSlots = investor.getOpenSlots();
  	len = openSlots.length;
  	for (var i = 0; i < len; i++) {
  	  var slotIdx = openSlots[i];
  	  this._rounds[slotIdx].status = 'INCOMPLETE';
  	  this._rounds[slotIdx].unscheduled.push(investor);
  	}
  	return true;
  } catch (e) {
    console.error(JSON.stringify(e, ['stack','message'],2));
    return false;
  }
};

Scheduler.prototype.addEntrepreneur = function (entrepreneur) {
  try {
    if (!(entrepreneur instanceof Entrepreneur)) {
      throw "Invalid Entrepreneur Object";
    }
  	var entName = entrepreneur.getName();
  	if (this.hasEntrepreneur(entName)) {
//  		throw "Duplicate Entrepreneur";
      return false;
  	}
  	var idx = entrepreneur.getIndex();
  	var len = this._entrepreneurs.length;
  	if (idx === -1 || idx >= len) {
  		entrepreneur.setIndex(len);
  		this._entrepreneurs.push(entrepreneur);
  	} else {
  		this._entrepreneurs[idx] = entrepreneur;
  	}
  	return true;
  } catch (e) {
    console.error(JSON.stringify(e, ['stack','message'],2));
    return false;
  }
};

Scheduler.prototype.manualAssignMeeting = function (time, investorName, entrepreneurName) {
  try {
    var entrepreneur = this.getEntrepreneurByName(entrepreneurName);
    if (!entrepreneur) {
      console.log('Entrepreneur ' + entrepreneurName + ' not found');
      return false;
//      throw new Error('Entrepreneur not found');
    }
    var investor = this.getInvestorByName(investorName);
    if (!investor) {
      console.log('Investor ' + investorName + ' not found');
      return false;
//      throw new Error('Investor not found');
    }
    entrepreneur.clearSlot(time);
    return investor.manualFillSlot(time, entrepreneurName);
  } catch (e) {
    console.log(JSON.stringify(e, ['stack','message'],2));
    return false;
  }
};

Scheduler.prototype.manualRemoveMeeting = function (time, investorName) {
  try {
    var investor = this.getInvestorByName(investorName);
    if (!investor) {
      console.log('Investor ' + investorName + ' not found');
      return false;
//      throw new Error('Investor not found');
    }
    return investor.freeSlot(time);
  } catch (e) {
    console.log(JSON.stringify(e, ['stack','message'],2));
    return false;
  }
};

Scheduler.prototype.handleManuals = function (manuals) {
  var that = this,
    noerror = true;
  if (manuals.removes) {
    manuals.removes.forEach(function (elem, idx, arr) {
      if (!(that.manualRemoveMeeting(elem.time, elem.investor))) {
        console.log('error manually removing meeting for investor ' + elem.investor + ' at ' + elem.time);
        noerror = false;
      }
    });
  }

  manuals.assigns.forEach(function (elem, idx, arr) {
    if (!(that.manualAssignMeeting(elem.time, elem.investor, elem.entrepreneur))) {
      noerror = false;
    }
  });

  return noerror;
};

Scheduler.prototype.indexEntrepreneurs = function () {
  var len = this._entrepreneurs.length;
  for (var i = 0; i < len; i++) {
		var entry = this._entrepreneurs[i];
		if (entry && entry !== 'NONE') {
		  var name = entry.getName();
		  var uid = entry.getUid();
		  this._info.entrepreneurs[name] = {
			 "index": i
		  };
		  this._info.entrepreneur_uids[uid] = {
		    "index": i
		  };
		  entry.setIndex(i);
		}
  }
  return true;
};

Scheduler.prototype.indexInvestors = function () {
  var len = this._investors.length;
  for (var i = 0; i < len; i++) {
  	var entry = this._investors[i];
  	if (entry && entry !== 'NONE') {
  		var name = entry.getName();
  		var uid = entry.getUid();
  		var loc = (name in this._info.investors) ? this._info.investors[name].location : entry.getLocation();
  		if (!loc) {
  			loc = "UNKNOWN";
  		}
  		this._info.investors[name] = {
  			"index": i,
  			"location": loc
  		};
  		this._info.investor_uids[uid] = {
  		  "index": i,
  		  "location": loc
  		};
  		entry.setIndex(i);
  		entry.setLocation(loc);
  	}
  }
  return true;
};

Scheduler.prototype.clearRound = function (round) {
  this._rounds[round].status = 'NONE';
  this._rounds[round].unscheduled = [];
  var time = meeting_times[round];
  this._entrepreneurs.forEach(function (elem, idx, arr) {
    elem.clearSlot(time);
  });
  this._investors.forEach(function (elem, idx, arr) {
    elem.freeSlot(time);
  });
  return true;
};

Scheduler.prototype.clearRounds = function () {
  var noerror = true;
  for (var i = 0; i < 10; i++) {
    noerror = (this.clearRound(i) && noerror);
  }
  return noerror;
};

Scheduler.prototype.scheduleRound = function (round) {
  var len = this._investors.length;
  var time = meeting_times[round];
  for (var i = 0; i < len; i++) {
    var n = (i + round) % len;
    this._investors[n].fillSlot(time);
  }
  this._rounds[round].status = 'COMPLETE';
  this._rounds[round].unscheduled = [];
  return true;
};

Scheduler.prototype.scheduleRounds = function () {
  var noerror = true;
  for (var i = 0; i < 10; i++) {
    noerror = (this.scheduleRound(i) && noerror);
  }
  return noerror;
};

Scheduler.prototype.finishRound = function (round) {
  var len = this._rounds[round].unscheduled;
  for (var i = 0; i < len; i++) {
    var n = (i + round) % len;
    this._rounds[round].unscheduled[n].fillSlot(round);
  }
  this._rounds[round].status = 'COMPLETE';
  this._rounds[round].unscheduled = [];
  return true;
};

Scheduler.prototype.finishRounds = function () {
  var noerror = true;
  for (var i = 0; i < 10; i++) {
    noerror = (this.finishRound(i) && noerror);
  }
  return noerror;
};

Scheduler.prototype.getEntrepreneurObjects = function () {
  var entrepreneurs = [];
  this._entrepreneurs.forEach(function (elem, idx, arr) {
    if (elem !== 'NONE') {
      entrepreneurs.push(elem.outputToObject());
    }
  });
  return entrepreneurs;
};

Scheduler.prototype.getInvestorObjects = function () {
  var investors = [];
  this._investors.forEach(function (elem, idx, arr) {
    if (elem !== 'NONE') {
      investors.push(elem.outputToObject());
    }
  });
  return investors;
};

Scheduler.prototype.getEntrepreneursRound = function (round) {
  try {
    if (round < 0 || round > 9) {
      throw "Invalid round";
    }
    var roundArray = [];
    this._entrepreneurs.forEach(function (elem, idx, arr) {
      var time = meeting_times[round];
      var entName = elem.getName();
      var entUid = elem.getUid();
      var invName = elem.getSlot(time);
      var invUid = crypto.createHash('sha1').update(invName).digest('hex');
      var roundUid = crypto.createHmac('sha1',time).update(entName).digest('hex');
      roundArray.push({
       "_id":roundUid,
      "round":(round + 1),
      "time":time,
      "entrepreneur":entName,
      "entrepreneurs_id":entUid,
      "investor":invName,
      "investor_id":invUid
      });
    });
    return roundArray;
  } catch (e) {
    console.error(JSON.stringify(e, ['stack','message'],2));
  }
};

Scheduler.prototype.getInvestorsRound = function (round) {
  try {
    if (round < 0 || round > 9) {
      throw "Invalid round";
    }
    var roundArray = [];
    this._investors.forEach(function (elem, idx, arr) {
      var time = meeting_times[round];
      var iname = elem.getName();
      var iuid = elem.getUid();
      var ename = elem.getSlot(time);
      var euid = crypto.createHash('sha1').update(ename).digest('hex');
      var roundUid = crypto.createHmac('sha1',time).update(iname).digest('hex');
      roundArray.push({
        "_id":roundUid,
      "round":(round + 1),
      "time":time,
      "investor":iname,
      "investor_id":iuid,
      "entrepreneur":ename,
      "entrepreneur_id":euid
      });
    });
    return roundArray;
  } catch (e) {
    console.error(JSON.stringify(e, ['stack','message'],2));
  }
};

Scheduler.prototype.getRoundObject = function (round) {
  var eround = this.getEntrepreneursRound(round);
  var iround = this.getInvestorsRound(round);
  return {
    "round": round,
    "entrepreneurs": eround,
    "investors": iround
  };
};

Scheduler.prototype.getRoundObjectsArray = function () {
  var roundsArray = new Array(10);
  for (var i = 0; i < 10; i++) {
    roundsArray[i] = this.getRoundObject(i);
  }
  return roundsArray;
};

Scheduler.prototype.writeEntrepreneursToJSON = function (filename, options) {
  var that = this;

  if (OVERWRITE) {
    var obj;
    if (options && options.bare) {
      obj = that.getEntrepreneurObjects();
    } else {
      obj = {
        "entrepreneurs": that.getEntrepreneurObjects()
      };
    }
    fs.writeFile(filename, JSON.stringify(obj), {encoding:'utf8',flag:'w'}, function (err) {
      if (err) {
        throw err;
      }
      console.log('wrote entrepreneurs to '+filename+' at '+Date.now());
    });
  } else {
    fs.exists(filename, ( function (scheduler, options) {
      return function (exists) {
        if (exists) {
          console.log(filename + ' already exists. Aborting write operation.');
        } else {
          var obj;
          if (options && options.bare) {
            obj = scheduler.getEntrepreneurObjects();
          } else {
            obj = {
              "entrepreneurs": scheduler.getEntrepreneurObjects()
            };
          }

          fs.writeFile(filename, JSON.stringify(obj), {encoding:'utf8',flag:'w'}, function (err) {
            if (err) {
              throw err;
            }
            console.log('wrote entrepreneurs to '+filename+' at '+Date.now());
          });
        }
      };
    })(that, options));
  }
};

Scheduler.prototype.writeInvestorsToJSON = function (filename, options) {
  var that = this;
  if (OVERWRITE) {
    var obj;
    if (options && options.bare) {
      obj = that.getInvestorObjects();
    } else {
      obj = {
        "investors": that.getInvestorObjects()
      };
    }
    fs.writeFile(filename, JSON.stringify(obj), {encoding:'utf8',flag:'w'}, function (err) {
      if (err) {
        throw err;
      }
      console.log('wrote investors to '+filename+' at '+Date.now());
    });
  } else {
    fs.exists(filename, ( function (scheduler, options) {
      return function (exists) {
        if (exists) {
          console.log(filename + ' already exists. Aborting write operation.');
        } else {
          var obj;
          if (options && options.bare) {
            obj = scheduler.getEntrepreneurObjects();
          } else {
            obj = {
              "entrepreneurs": scheduler.getEntrepreneurObjects()
            };
          }

          fs.writeFile(filename, JSON.stringify(obj), {encoding:'utf8',flag:'w'}, function (err) {
            if (err) {
              throw err;
            }
            console.log('wrote investors to '+filename+' at '+Date.now());
          });
        }
      };
    })(that, options));
  }
};

Scheduler.prototype.writeCompaniesToJSON = function (filename) {
  var that = this;
  if (OVERWRITE) {
    var obj = {
      "entrepreneurs": that.getEntrepreneurObjects(),
      "investors": that.getInvestorObjects()
    };
    fs.writeFile(filename, JSON.stringify(obj), {encoding:'utf8',flag:'w'}, function (err) {
      if (err) {
        throw err;
      }
      console.log('wrote companies to '+filename+' at '+Date.now());
    });
  } else {
    fs.exists(filename, ( function (scheduler) {
      return function (exists) {
        if (exists) {
          console.log(filename + ' already exists. Aborting write operation.');
        } else {
          var obj = {
            "entrepreneurs": that.getEntrepreneurObjects(),
            "investors": that.getInvestorObjects()
          };
          fs.writeFile(filename, JSON.stringify(obj), {encoding:'utf8',flag:'w'}, function (err) {
            if (err) {
              throw err;
            }
            console.log('wrote companies to '+filename+' at '+Date.now());
          });
        }
      };
    })(that));
  }
};

Scheduler.prototype.writeRoundsToJSON = function (filename) {
  var that = this;
  if (OVERWRITE) {
    var obj = {
      "rounds": that.getRoundObjectsArray()
    };
    fs.writeFile(filename, JSON.stringify(obj), {encoding:'utf8',flag:'w'}, function (err) {
      if (err) {
        throw err;
      }
      console.log('wrote rounds to '+filename+' at '+Date.now());
    });
  } else {
    fs.exists(filename, ( function (scheduler) {
      return function (exists) {
        if (exists) {
          console.log(filename + ' already exists. Aborting write operation.');
        } else {
          var obj = {
            "rounds": that.getRoundObjectsArray()
          };
          fs.writeFile(filename, JSON.stringify(obj), {encoding:'utf8',flag:'w'}, function (err) {
            if (err) {
              throw err;
            }
            console.log('wrote rounds to '+filename+' at '+Date.now());
          });
        }
      };
    })(that));
  }
};

Scheduler.prototype.writeToJSON = function (filename) {
  var that = this;
  if (OVERWRITE) {
    var schedule = {
      "entrepreneurs": that.getEntrepreneurObjects(),
      "investors": that.getInvestorObjects(),
      "rounds": that.getRoundObjectsArray()
    };
    fs.writeFile(filename, JSON.stringify(schedule), {encoding:'utf8',flag:'w'}, function (err) {
      if (err) {
        throw err;
      }
      console.log('wrote schedule to '+filename+' at '+Date.now());
    });
  } else {
    fs.exists(filename, ( function (scheduler) {
      return function (exists) {
        if (exists) {
          console.log(filename + ' already exists. Aborting write operation.');
        } else {
          var schedule = {
            "entrepreneurs": scheduler.getEntrepreneurObjects(),
            "investors": scheduler.getInvestorObjects(),
            "rounds": scheduler.getRoundObjectsArray()
          };
          fs.writeFile(filename, JSON.stringify(schedule), {encoding:'utf8',flag:'w'}, function (err) {
            if (err) {
              throw err;
            }
            console.log('wrote schedule to '+filename+' at '+Date.now());
          });
        }
      };
    })(that));
  }
};

Scheduler.prototype.rebuildEntrepreneursFromMongo = function (db) {
  var companyList = db.collection('companyList');
  var that = this;
  var entrepreneurs = [];
  companyList.find({}).toArray(function (err, docs) {
    if (err) {
      return console.error(err);
    }
    console.log('Attempting to get company_list');
    docs[0].company_list.forEach(function (val, idx, array) {
      var companyName = Object.keys(val)[0];
      var companyIndex = val[companyName];
      var entrepreneurObject = new Entrepreneur(that, companyName, companyIndex);
      entrepreneurs.push(entrepreneurObject);
    });
  });

  this.resetEntrepreneurs(entrepreneurs);
};

Scheduler.prototype.rebuildInvestorsFromMongo = function (db) {
  var firmList = db.collection('firmList');
  var that = this;
  var investors = [];
  firmList.find({}).toArray(function (err, docs) {
    if (err) {
      return console.error(err);
    }
    console.log('Attempting to get firm_list');
    docs.forEach(function (val, idx, array) {
      var firmName = val.firm_name;
      var firmIndex = val.index;
      var firmChoices = val.choices;
      var firmSlots = val.slots;
      var newInvestor = new Investor(that, firmName, firmIndex, "UNKNOWN", firmChoices);
      investors.push(newInvestor);
    });
  });

  this.resetInvestors(investors);
};


Scheduler.prototype.rebuildFromMongo = function () {
  this.rebuildEntrepreneursFromMongo(this._db);
  var noerror = this.rebuildInvestorsFromMongo(this._db);
  noerror = (this.clearRounds() && noerror);
  noerror = (this.indexEntrepreneurs() && noerror);
  noerror = (this.indexInvestors() && noerror);
  return noerror;
};


Scheduler.prototype.rebuildFromXlsxSheets = function (inputSheet, keysSheet, locationSheet) {
  var noerror = Utils.createObjectsFromSheets(this, inputSheet, keysSheet, locationSheet);
  noerror = (this.clearRounds() && noerror);
	noerror = (this.indexEntrepreneurs() && noerror);
  noerror = (this.indexInvestors() && noerror);
  return noerror;
};

Scheduler.prototype.buildFromXlsxSheets = function (inputSheet, keysSheet, locationSheet) {
  try {
    if (this._investors.length > 0 || this._entrepreneurs.length > 0) {
      throw "Investors and entrepreneurs need to be empty to perform build. Should use rebuild.";
    }
		return this.rebuildFromXlsxSheets(inputSheet, keysSheet, locationSheet);
  } catch (e) {
    console.error(JSON.stringify(e, ['stack','message'],2));
    return false;
  }
};

Scheduler.prototype.rebuildFromXlsxFiles = function (inputFilename, keysFilename, locationFilename) {
  var inputSheet = Utils.getInputSheetFromFile(inputFilename);
  var keysSheet = Utils.getKeysSheetFromFile(keysFilename);
  if (!inputSheet || !keysSheet) {
    return false;
  }
  var locationSheet;
  if (locationFilename) {
    locationSheet = Utils.getLocationSheetFromFile(locationFilename);
    if (!locationSheet) {
      return false;
    }
    return this.rebuildFromXlsxSheets(inputSheet, keysSheet, locationSheet);
  } else {
    return this.rebuildFromXlsxSheets(inputSheet, keysSheet);
  }
};

Scheduler.prototype.buildFromXlsxFiles = function (inputFilename, keysFilename, locationFilename) {
  try {
    if (this._investors.length > 0 || this._entrepreneurs.length > 0) {
      throw "Investors and entrepreneurs need to be empty to perform build. Should use rebuild.";
    }
    var inputSheet = Utils.getInputSheetFromFile(inputFilename);
    var keysSheet = Utils.getKeysSheetFromFile(keysFilename);
    if (!inputSheet || !keysSheet) {
      return false;
    }
    var locationSheet;
    if (locationFilename) {
      locationSheet = Utils.getLocationSheetFromFile(locationFilename);
      if (!locationSheet) {
        return false;
      }
      return this.rebuildFromXlsxSheets(inputSheet, keysSheet, locationSheet);
    } else {
      return this.rebuildFromXlsxSheets(inputSheet, keysSheet);
    }
  } catch (e) {
    console.error(JSON.stringify(e, ['stack','message'],2));
    return false;
  }
};

Scheduler.prototype.autoRebuild = function () {
  return this.rebuildFromXlsxFiles('./uploads/choices.xlsx','./uploads/keys.xlsx','./uploads/locations.xlsx');
};

Scheduler.prototype.autoWrite = function () {
  this.writeEntrepreneursToJSON('./api/entrepreneurs/index.get.json', {bare: true});
  this.writeInvestorsToJSON('./api/investors/index.get.json', {bare: true});
  return true;
};

var instance;
Scheduler.getInstance = function () {
  if (!instance) {
    instance = new Scheduler();
  }

  return instance;
};

module.exports = {
	"Scheduler": Scheduler,
	"Utils": Utils,
	"Entrepreneur": Entrepreneur,
	"Investor": Investor,
	"getInstance": Scheduler.getInstance
};
