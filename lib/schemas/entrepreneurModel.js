var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var entrepreneurSchema = new Schema({
  form_id: {type: String, unique: true},
  name: String,
  email: String,
  phone: String,
  company_name: String,
  company_website: String,
  is_healthcare: String,
  company_track: [String],
  description: String,
  problem: String,
  solution: String,
  launched_product: String,
  early_adopters_use: String,
  paying_customers_use: String,
  capital_type_raised: [String],
  amount_raised: String,
  investors: String,
  is_accelerator_grad: String,
  accelerator_details: String,
  company_hq: String,
  num_employees: String,
  last_revenue: String,
  last_ebitda: String,
  proj_revenue: String,
  proj_ebitda: String
});

var EntrepreneurModel = mongoose.model('Entrepreneur', entrepreneurSchema);

module.exports = EntrepreneurModel;
