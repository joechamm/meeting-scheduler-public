var XLSX = require('xlsx'),
  crypto = require('crypto'),
	Entrepreneur = require('./entrepreneur.js'),
	Investor = require('./investor.js');

// Helper function to get the i'th entrepreneur's name from keys sheet
function readEntrepreneurName (sheet, i) {
	var cellKey = 'B' + (i + 1).toString();
	if (!(cellKey in sheet) || !('v' in sheet[cellKey])) {
		return "Improperly formatted key sheet";
	}
	return sheet[cellKey].v;
}

// Helper function to get the i'th investors's name from keys sheet
function readInvestorName (sheet, i) {
  var cellKey = 'A' + (i + 1).toString();
	if (!(cellKey in sheet) || !('v' in sheet[cellKey])) {
		return "Improperly formatted key sheet";
	}
	return sheet[cellKey].v;
}

function readInvestorChoice (sheet, i, n) {
  var rowStr = (i + 2).toString();
  var colStr = String.fromCharCode(66 + n);
  var choiceKey = colStr + rowStr;
  if (!(choiceKey in sheet) || !('v' in sheet[choiceKey])) {
    return 'NONE';
  }

  var regEx = /^E[0-9]+/;
  if (regEx.test(sheet[choiceKey].v)) {
    if (sheet[choiceKey].v === 'E0') {
      return 'NONE';
    }

    return sheet[choiceKey].v;
  }

  return 'NONE';

}

// Helper function to get i'th investor's location - Current just returns UNKNOWN as the format is uncertain
function readInvestorLocation (sheet, i) {
  var cellKey = 'A' + (i + 1).toString();
  if (!(cellKey in sheet) || !('v' in sheet[cellKey])) {
    return 'UNKNOWN';
  }
  return sheet[cellKey].v;
}

// Helper function to build the array of the i'th investor's choices from input sheet
function buildInvestorChoices (sheet, i) {
	try {
		var choices = new Array(20);
		for (var n = 0; n < 20; n++) {
			var entIdx = readInvestorChoice(sheet, i, n);
			if (entIdx === 'NONE') {
			  choices[n] = - 1;
			} else {
			  if (typeof entIdx === 'string') {
			    entIdx = entIdx.replace('E','');
				  entIdx = parseInt(entIdx);
				}
				choices[n] = entIdx - 1;
			}
		}
		return choices;
	} catch (e) {
		console.error(JSON.stringify(e, ['stack','message'], 2));
	}
}

// Helper function to count the number of investors and entrepreneurs from a keys sheet
function countCompanies (sheet) {
	var companyCount = {
		"investors": 0,
		"entrepreneurs": 0
	};
	for (var cell in sheet) {
		if (cell.indexOf('A') !== -1) {
			companyCount.investors++;
		} else if (cell.indexOf('B') !== -1) {
			companyCount.entrepreneurs++;
		}
	}
	return companyCount;
}

function getInputSheetFromFile (inFilename, sheetName) {
  var wb = XLSX.readFile(inFilename);
  sheetName = sheetName ? sheetName : wb.SheetNames[0];
  return wb.Sheets[sheetName];
}

function getKeysSheetFromFile (keysFilename, sheetName) {
  var wb = XLSX.readFile(keysFilename);
  sheetName = sheetName ? sheetName : wb.SheetNames[0];
  return wb.Sheets[sheetName];
}

function getLocationSheetFromFile (locationFilename, sheetName) {
  var wb = XLSX.readFile(locationFilename);
  sheetName = sheetName ? sheetName : wb.SheetNames[0];
  return wb.Sheets[sheetName];
}

function getSheetsFromFile (wbFilename, inSheetName, keySheetName, locationSheetName) {
  try {
    var wb = XLSX.readFile(wbFilename);
    if (wb.SheetNames.length < 3) {
      throw "Not enough sheets in workbook";
    }
    var locationSheet;
    inSheetName = inSheetName ? inSheetName : wb.SheetNames[0];
    keySheetName = keySheetName ? keySheetName : wb.SheetNames[1];
    if (wb.SheetNames.length > 2) {
      locationSheetName = locationSheetName ? locationSheetName : wb.SheetNames[2];
      locationSheet = wb.Sheets[locationSheetName];
    }

    return {
      "input": wb.Sheets[inSheetName],
      "keys": wb.Sheets[keySheetName],
      "locations": locationSheet
    };
  } catch (e) {
    console.error(JSON.stringify(e, ['stack','message'], 2));
    return false;
  }
}

function fixChoices(choices, removals) {
  var rlen = removals.length,
  clen = choices.length;

  for (var i = 0; i < rlen; i++) {
    var rem = removals[i];
    for (var j = 0; j < clen; j++) {
      if (choices[j] > rem) {
        choices[j] = choices[j] - 1;
      }
    }
  }

  return true;
}

function createObjectsFromSheets (scheduler, inputSheet, keysSheet, locationSheet) {
	try {
		if (!scheduler) {
			throw new Error('global scheduler not present for object creation');
		}
		var companyCount, entrepreneurs, investors, i, j, removals, idx, noerror;

    noerror = true;

		companyCount = countCompanies(keysSheet);

	  entrepreneurs = [];
	  investors = [];
	  removals = [];
	  idx = 0;

		for (i = 0; i < companyCount.entrepreneurs; i++) {
			var ename = readEntrepreneurName(keysSheet, i);
			if (ename.toLowerCase() !== 'none') {
			  var entrepreneur = new Entrepreneur(scheduler, ename, idx);
			  entrepreneurs.push(entrepreneur);
			  idx++;
      } else {
        removals.push(i);
      }
		}

		noerror = scheduler.resetEntrepreneurs(entrepreneurs);

    idx = 0;

		for (i = 0; i < companyCount.investors; i++) {
			var iname = readInvestorName(keysSheet, i);
			if (iname.toLowerCase() !== 'none') {
			  var loc;
  			if (locationSheet) {
  			  loc = readInvestorLocation(locationSheet, i);
  			} else {
  			  loc = 'UNKNOWN';
  			}
  			var choices = buildInvestorChoices(inputSheet, i);
  			fixChoices(choices, removals);
  			var investor = new Investor(scheduler, iname, idx, loc, choices);

  			investors.push(investor);

  			idx++;
  		}
  	}

		if (!(scheduler.resetInvestors(investors))) {
		  noerror = false;
		}
		return noerror;
  } catch (e) {
    console.error(JSON.stringify(e, ['stack','message'], 2));
    return false;
  }
}

module.exports = {
  readEntrepreneurName: readEntrepreneurName,
  readInvestorName: readInvestorName,
  readInvestorLocation: readInvestorLocation,
  readInvestorChoice: readInvestorChoice,
  buildInvestorChoices: buildInvestorChoices,
  countCompanies: countCompanies,
  fixChoices: fixChoices,
  getInputSheetFromFile: getInputSheetFromFile,
  getKeysSheetFromFile: getKeysSheetFromFile,
  getLocationSheetFromFile: getLocationSheetFromFile,
  getSheetsFromFile: getSheetsFromFile,
	createObjectsFromSheets: createObjectsFromSheets
};
