var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var investorSchema = new Schema({
  form_id: {type: String, unique: true},
  name: String,
  email: String,
  phone: String,
  firm_name: String,
  firm_address: String,
  vip_dinner: String,
  unavailable: String  
});

var InvestorModel = mongoose.model('Investor', investorSchema);

module.exports = InvestorModel;
