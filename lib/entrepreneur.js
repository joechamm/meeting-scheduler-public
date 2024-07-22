var fs = require('fs'),
  crypto = require('crypto'),
  OVERWRITE = true,
  meeting_times = ["9:00AM","9:40AM","10:20AM","11:00AM","12:40PM","1:20PM","2:00PM","2:40PM","3:20PM","4:00PM"];
function Entrepreneur(scheduler, ename, index) {
	try {
		if (!ename || !scheduler) {
			throw new Error("name and global scheduler required for Entrepreneur instantiation");
		}
		var that = this;
		this._scheduler = scheduler;  // reference to global scheduler object
		this._name = ename;
		this._uid = crypto.createHash('sha1').update(ename).digest('hex');
		this._meetings = {};
		this._meetings.times = {};
		this._meetings.investors = {};
		this._meetings.owner = this._name;
		meeting_times.forEach(function (elem, idx, arr) {
			that._meetings.times[elem] = "open";
		});
		this._index = index;
	} catch (e) {
		console.error(JSON.stringify(e, ['stack','message'],2));
	}
}

Entrepreneur.prototype.outputToObject = function () {
  var that = this;
  var meetings = [];
  meeting_times.forEach(function (elem, idx, arr) {
    var investor = that._meetings.times[elem];
    var loc = (investor in that._meetings.investors) ? that._meetings.investors[investor].location : '';
    meetings.push({time: elem, company: investor, location: loc});
  });

	return {
			"_id": this._uid,
			"name": this._name,
    	"type": "entrepreneur",
    	"index": this._index,
    	"meetings": meetings
  		};
};

Entrepreneur.prototype.outputToString = function () {
  var obj = this.outputToObject();
  return JSON.stringify(obj);
};

Entrepreneur.prototype.writeToJSON = function (filename) {
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

Entrepreneur.prototype.getName = function () {
  return this._name;
};

Entrepreneur.prototype.getUid = function () {
  return this._uid;
};

Entrepreneur.prototype.getIndex = function () {
  return this._index;
};

Entrepreneur.prototype.setIndex = function (idx) {
  this._index = idx;
};

Entrepreneur.prototype.slotOpen = function (time) {
	return this._meetings.times[time] === 'open';
};

Entrepreneur.prototype.findInvestor = function (investorName) {
  return (investorName in this._meetings.investors) ? this._meetings.investors[investorName].time : false;
};

Entrepreneur.prototype.addInvestor = function (time, investorName) {
  if (this._meetings.times[time] === 'open') {
    if (!(investorName in this._meetings.investors)) {
			var investor = this._scheduler.getInvestorByName(investorName);
			if (investor && investor !== 'NONE') {
  			var choiceIndex = investor.getChoiceIndexByName(this._ename);
  			var loc = investor.getLocation();
        this._meetings.times[time] = investorName;
        this._meetings.investors[investorName] = {
          "time": time,
          "choice": choiceIndex,
  				"location": loc
        };
        return true;
      }
    }
  }
  return false;
};

Entrepreneur.prototype.clearSlot = function (time) {
  var inv = this._meetings.times[time];
  if (inv !== 'open') {
		if (inv in this._meetings.investors) {
			delete this._meetings.investors[inv];
		}
    this._meetings.times[time] = "open";
  }
  return true;
};

Entrepreneur.prototype.getSlot = function (time) {
  return this._meetings.times[time];
};

Entrepreneur.prototype.clearInvestor = function (investor) {
  if (investor in this._meetings.investors) {
    var time = this._meetings.investors[investor].time;
    this._meetings.times[time] = "open";
    delete this._meetings.investors[investor];
    return true;
  }
  return false;
};

// return an array containing the open meetings
Entrepreneur.prototype.getOpenSlots = function () {
  var that = this;
  var openSlots = [];
  meeting_times.forEach(function (elem, idx, arr) {
    if (that._meetings.times[elem] === 'open') {
      openSlots.push(elem);
    }
  });
  return openSlots;
};

// return an array containing the filled meetings
Entrepreneur.prototype.getFilledSlots = function () {
  var that = this;
  var filledSlots = [];
  meeting_times.forEach(function (elem, idx, arr) {
    if (that._meetings.times[elem] !== 'open') {
      filledSlots.push(elem);
    }
  });
  return filledSlots;
};

// return an array containing the company's meetings formatted as {time,investor,choice}
Entrepreneur.prototype.getMeetings = function () {
  var that = this,
    meetings = [];

  for (var key in this._meetings.investors) {
    var time = that._meetings.investors[key].time;
		var loc = that._meetings.investors[key].location;
    meetings.push({"time":time,"investor":key,"location":loc});
  }

  return meetings;

};
module.exports = Entrepreneur;
