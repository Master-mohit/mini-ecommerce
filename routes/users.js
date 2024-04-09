const mongoose = require("mongoose");
const plm = require("passport-local-mongoose");

mongoose.connect("mongodb://127.0.0.1:27017/challange");
const userSchema = mongoose.Schema({
  username: String,
  password: String,
  email: String,
  products: [{ type: mongoose.Schema.Types.ObjectId, ref: 'pro' }] ,
  
  cart: [{
  c_name: String,
  c_image: String,
  c_description: String,
  c_price: Number, 
  c_id:String,
  c_quant:{ 
    type:Number, 
    default: 1
  }
  
  }],
  wishlist: [{
  w_name: String,
  w_image: String,
  w_description: String,
   w_id:String
  }],
  
});


userSchema.plugin(plm);
module.exports = mongoose.model("user", userSchema);
