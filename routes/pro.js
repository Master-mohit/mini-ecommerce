const mongoose = require("mongoose");

const productSchema = mongoose.Schema({
  p_name: String,
  p_image: String, 
  p_description: String,
  p_price: Number,
 
  
});

module.exports = mongoose.model("pro", productSchema);
