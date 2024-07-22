var MeetingScheduler = require('./../lib/scheduler.js'),
		Scheduler = MeetingScheduler.Scheduler,
		inputFilename = './data/input.xlsx',
		keysFilename = './data/keys.xlsx',
		outputAllFilename = './test_all.json',
		outputEntsFilename = './test_entrepreneurs.json',
		outputInvsFilename = './test_investors.json',
		outputCompsFilename = './test_companies.json',
		outputRoundsFilename = './test_rounds.json';

var scheduler = new MeetingScheduler.Scheduler();
scheduler.buildFromXlsxFiles(inputFilename, keysFilename);
scheduler.scheduleRounds();
scheduler.writeEntrepreneursToJSON(outputEntsFilename);
scheduler.writeInvestorsToJSON(outputInvsFilename);
scheduler.writeCompaniesToJSON(outputCompsFilename);
scheduler.writeRoundsToJSON(outputRoundsFilename);
scheduler.writeToJSON(outputAllFilename);
