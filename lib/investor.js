var fs = require('fs'),
  crypto = require('crypto'),
  OVERWRITE = true,
  meeting_times = ["9:00AM","9:40AM","10:20AM","11:00AM","12:40PM","1:20PM","2:00PM","2:40PM","3:20PM","4:00PM"];
function Investor (scheduler, iname, index, location, choices) {
	try {
		if (!iname || !scheduler || !choices) {
			throw new Error("name global scheduler and choice array required for Investor instantiation");
		}
  	var that = this;
		this._scheduler = scheduler; // reference to global scheduler object
  	this._name = iname;
 	 	this._uid = crypto.createHash('sha1').update(iname).digest('hex');
  	this._choices = new Array(20);
  	this._meetings = {};
		this._meetings.times = {};
		this._meetings.entrepreneurs = {};
		this._meetings.owner = this._name;
    meeting_times.forEach(function (elem, idx, arr) {
      that._meetings.times[elem] = "open";
    });
    for (var i = 0; i < choices.length; i++) {
      if (choices[i] >= 0) {
        var entrepreneur = this._scheduler.getEntrepreneurByIndex(choices[i]);
        if (entrepreneur) {
          this._choices[i] = entrepreneur;
        } else {
          this._choices[i] = 'NONE';
        }
      } else {
          this._choices[i] = 'NONE';
      }
    }
		this._location = location;
		this._index = index;
	} catch (e) {
		console.error(JSON.stringify(e, ['stack','message'],2));
	}
}

Investor.prototype.outputToObject = function () {
  var that = this;
//  var choices = [];
  var meetings = [];

  meeting_times.forEach(function (elem, idx, arr) {
    var entrepreneur = that._meetings.times[elem];
    meetings.push({time: elem, company: entrepreneur});
  });

 return {
    "_id": this._uid,
    "name": this._name,
    "type": "investor",
		"location": this._location,
    "index": this._index,
    "meetings": meetings
  };
};

Investor.prototype.outputToString = function () {
  var obj = this.outputToObject();
  return JSON.stringify(obj);
};

Investor.prototype.writeChoicesToJSON = function (filename) {
  if (!filename) {
    filename = this._name + '.json';
  }
  var obj = this.outputChoicesToObject();
  if (OVERWRITE) {
    var str = JSON.stringify(obj);
    fs.writeFile(filename, str, {encoding:'utf8',flag:'w'}, function (err) {
      if (err) {
        throw err;
      }
      console.log('wrote '+filename+' as JSON object.');
    });
  } else {
    fs.exists(filename, ( function (inObj) { return function (exists) {
      if (exists) {
        console.log(filename + ' already exists. Aborting write operation.');
      } else {
        var str = JSON.stringify(inObj);
        fs.writeFile(filename, str, {encoding:'utf8',flag:'w'}, function (err) {
          if (err) {
            throw err;
          }
          console.log('wrote '+filename+' as JSON object.');
        });
      }
    };
    })(obj));
  }
};

Investor.prototype.writeTimeslotsToJSON = function (filename) {
  if (!filename) {
    filename = this._name + '.json';
  }
  var obj = this.outputTimeslotsToObject();
  if (OVERWRITE) {
    var str = JSON.stringify(obj);
    fs.writeFile(filename, str, {encoding:'utf8',flag:'w'}, function (err) {
      if (err) {
        throw err;
      }
      console.log('wrote '+filename+' as JSON object.');
    });
  } else {
    fs.exists(filename, ( function (inObj) { return function (exists) {
      if (exists) {
        console.log(filename + ' already exists. Aborting write operation.');
      } else {
        var str = JSON.stringify(inObj);
        fs.writeFile(filename, str, {encoding:'utf8',flag:'w'}, function (err) {
          if (err) {
            throw err;
          }
          console.log('wrote '+filename+' as JSON object.');
        });
      }
    };
    })(obj));
  }
};

Investor.prototype.writeToJSON = function (filename) {
  if (!filename) {
    filename = this._name + '.json';
  }
  var obj = this.outputToObject();
  if (OVERWRITE) {
    var str = JSON.stringify(obj);
    fs.writeFile(filename, str, {encoding:'utf8',flag:'w'}, function (err) {
      if (err) {
        throw err;
      }
      console.log('wrote '+filename+' as JSON object.');
    });
  } else {
    fs.exists(filename, ( function (inObj) { return function (exists) {
      if (exists) {
        console.log(filename + ' already exists. Aborting write operation.');
      } else {
        var str = JSON.stringify(inObj);
        fs.writeFile(filename, str, {encoding:'utf8',flag:'w'}, function (err) {
          if (err) {
            throw err;
          }
          console.log('wrote '+filename+' as JSON object.');
        });
      }
    };
    })(obj));
  }
};

Investor.prototype.getName = function () {
  return this._name;
};

Investor.prototype.getUid = function () {
  return this._uid;
};

Investor.prototype.getIndex = function () {
  return this._index;
};

Investor.prototype.setIndex = function (idx) {
  this._index = idx;
};

Investor.prototype.getLocation = function () {
	return this._location;
};

Investor.prototype.setLocation = function (loc) {
	this._location = loc;
};

Investor.prototype.getChoiceIndexByName = function (ename) {
  for (var i = 0; i < this._choices.length; i++) {
    if (this._choices[i] !== 'NONE') {
      var chname = this._choices[i].getName();
      if (chname === ename) {
        return i;
      }
    }
  }

	return - 1;
};

Investor.prototype.slotOpen = function (time) {
  return this._meetings.times[time] === 'open';
};

Investor.prototype.fillSlot = function (time) {
  if (this._meetings.times[time] === 'open') {
    for (var i = 0; i < this._choices.length; i++) {
      if (this._choices[i] !== 'NONE' && this._choices[i].addInvestor(time, this._name)) {
        var choice = this._choices[i].getName();
        this._meetings.times[time] = choice;
        this._meetings.entrepreneurs[choice] = {
          "time": time,
          "choice": i
        };
        return true;
      }

    }
  }
  return false;
};

// TODO: determine how to clear an investor's time slot
Investor.prototype.freeSlot = function (time) {
  var noerror = true;
	if (this._meetings.times[time] !== 'open' && this._meetings.times[time] !== 'busy') {
		var entName = this._meetings.times[time];
		var entrepreneur = this._scheduler.getEntrepreneurByName(entName);
		if (entrepreneur) {
			noerror = entrepreneur.clearSlot(time);
		}
		if (entName in this._meetings.entrepreneurs) {
			delete this._meetings.entrepreneurs[entName];
		}
		this._meetings.times[time] = 'open';
	}
	return noerror;
};

Investor.prototype.manualFillSlot = function (time, entName) {
	try {
	  var that = this;
		var entrepreneur = this._scheduler.getEntrepreneurByName(entName);
		if (!entrepreneur) {
		  console.log('Entrepreneur ' + entName + ' not found');
		  return false;
//			throw new Error('Entrepreneur not found');
		}
		if (entrepreneur.findInvestor(this._name)) {
      console.log('Entrepreneur ' + entName + ' already meeting with investor ' + this._name);
      meeting_times.forEach(function (elem, idx, arr) {
        if (that._meetings.times[elem] === entName) {
          that._meetings.times[elem] = 'open';
        }
      });

      if (entrepreneur.clearInvestor(this._name)) {
        this._meetings.times[time] = 'open';
        console.log('successfully removed investor ' + this._name + ' from entrepreneur ' + entName);
      } else {
        console.log('failed to remove investor ' + this._name + ' from entrepreneur ' + entName);
        return false;
      }
//      return false;
//			throw new Error('Entrepreneur already meeting with this investor');


		}
		if (!entrepreneur.slotOpen(time)) {
		  console.log('Entrepreneur ' + entName + ' currently scheduled for meeting with ' + this._name + ' at ' + time);
		  return false;
//			throw new Error('Entrepreneur currently scheduled for meeting at this time');
		}
    var cntMeetName = this._meetings.times[time];
    if (cntMeetName === 'busy') {
      console.log('busy');
      return false;
    }
    if (cntMeetName !== 'open') {
      var cntEntrepreneur = this._scheduler.getEntrepreneurByName(cntMeetName);
      if (cntEntrepreneur) {
        cntEntrepreneur.clearSlot(time);
      } else {
        console.log('failed to find cntEntrepreneur ' + cntMeetName);
      }
    }

		var choiceIndex = this.getChoiceIndexByName(entName);
		this._meetings.times[time] = entName;
		this._meetings.entrepreneurs[entName] = {
			"time": time,
			"choice": choiceIndex
		};
		entrepreneur.addInvestor(time, this._name);
		return true;
	} catch (e) {
		console.error(JSON.stringify(e, ['stack','message'],2));
		return true;
	}
};

Investor.prototype.setBusy = function (time) {
  this.freeSlot(time);
  this._meetings.times[time] = 'busy';
  return true;
};

Investor.prototype.clearBusy = function (time) {
  if (this._meetings.times[time] === 'busy') {
    this._meetings.times[time] = 'open';
  }
  return true;
};

Investor.prototype.getSlot = function (time) {
  return this._meetings.times[time];
};

// return an array containing the open meetings
Investor.prototype.getOpenSlots = function () {
  var that = this;
  var openSlots = [];
  meeting_times.forEach(function(elem, idx, arr) {
    if (that._meetings.times[elem] === 'open') {
      openSlots.push(idx);
    }
  });
  return openSlots;
};

// return an array containing the filled meetings
Investor.prototype.getFilledSlots = function () {
  var that = this;
  var filledSlots = [];
  meeting_times.forEach(function(elem, idx, arr) {
    if (that._meetings.times[elem] !== 'open') {
      filledSlots.push(idx);
    }
  });
  return filledSlots;
};

// return an array containing the investor's meetings formatted as {time,entrepreneur,choice}
Investor.prototype.getMeetings = function () {
  var that = this,
    meetings = [];

  for (var key in this._meetings.entrepreneurs) {
    var time = that._meetings.entrepreneurs[key].time;
    meetings.push({"time":time,"entrepreneur":key});
  }

  return meetings;
};

module.exports = Investor;
