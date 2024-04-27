var express = require('express');
var router = express.Router();
const userModel = require("./users");
const productModel = require("./pro");
const uploads = require("./multer");
const passport = require("passport");
const localStrategy = require("passport-local");
const pro = require('./pro');
const upload = require('./multer');
const Razorpay = require("razorpay");
const { validatePaymentVerification } = require('razorpay/dist/utils/razorpay-utils');
passport.use(new localStrategy(userModel.authenticate()));


const instance = new Razorpay({
  key_id: 'rzp_test_siSorUn9S3dW9E',
  key_secret: 'WYa0ykSldShg8dv51iPXHz6I',
});

router.post('/create/orderId', function(req, res, next) {
  var p_price = req.body.p_price;
  var c_price = req.body.c_price;
  console.log("Request received to create order:", req.body); 
  var options = {
    amount: p_price * 100,    
    amount: c_price * 100,  
    currency: "INR",
    receipt: "order_rcptid_11"
  };
  instance.orders.create(options, function(err, order) {
    if(err) {
      console.error("Error creating order:", err); 
      return res.status(500).send({ error: "Internal Server Error" });
    }
    console.log("Order created successfully:", order); 
    res.send(order);
  });
});

router.post("/api/payment/verify", function(req, res) {
  try {
    const razorpayOrderId = req.body.razorpay_order_id;
    const razorpayPaymentId = req.body.razorpay_payment_id;
    const signature = req.body.razorpay_signature;
    const secret = 'WYa0ykSldShg8dv51iPXHz6I';
    const result = validatePaymentVerification({"order_id": razorpayOrderId, "payment_id": razorpayPaymentId}, signature, secret);
    res.send(result);
  } catch (error) {
    console.error("Error verifying payment:", error);
    res.status(500).send({ error: "Internal Server Error" });
  }
});

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

router.get('/search',isLoggedIn, async function(req, res, next) {
  const products = await productModel.find();
  res.render('search', {products});
});

router.post('/searchProduct', isLoggedIn, async (req, res, next) => {
  try {
      const query = req.body.data;

      const foundProducts = await productModel.find({
          $or: [
              { p_name: { $regex: query, $options: 'i' } },
             
          ]
      });

      res.status(200).json(foundProducts);
  } catch (error) {
      console.error('Error searching products:', error);
      res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.get('/profile',isLoggedIn,async function(req, res, next) {
  const user   =  await userModel.findOne({username: req.session.passport.user}).populate("cart", "wishlist");
  const product = await productModel.find();
  res.render('profile', {user, product});
});


router.get('/product',isLoggedIn, async function(req, res, next) {
  const user = await userModel.findOne({username: req.session.passport.user})
  try {
    const products = await productModel.find();
    res.render('product', { products , user});
  } catch (err) {
    console.error(err);
    res.status(500).send('Internal Server Error');
  }
});


router.get('/create',isLoggedIn, async function(req, res, next) {
  const user = await userModel.findOne({username: req.session.passport.user})
  const pro = await productModel.find();
  res.render('create', {user, pro});
});

router.post('/create', isLoggedIn,upload.single("image"), async function(req, res) {
  try {
    const user = await userModel.findOne({ username: req.session.passport.user }); 
    const newProduct = await productModel.create({
      p_name: req.body.p_name,
      p_image: req.file.filename,
      p_description: req.body.p_description,
      p_price: req.body.p_price,
    });
    user.products.push(newProduct._id); 
    await user.save();
    res.redirect("/product");
  } catch (err) {
    console.error(err);
    res.status(500).send('Internal Server Error');
  }
});


router.get('/login', function(req, res, next) {
  res.render('login');
});


router.get('/delete/:id', isLoggedIn, async function(req, res, next) {
  const productId = req.params.id; 
  const user = await userModel.findOne({ username: req.session.passport.user });
  
  if (!user) {
      return res.status(404).send("User not found");
  }

  const productIndexCart = user.cart.findIndex(item => item._id.toString() === productId);
  let productIndexWishlist = -1;
  if (user.wishlist) {
      productIndexWishlist = user.wishlist.findIndex(item => item._id.toString() === productId);
  }
  if (productIndexCart !== -1) {
      user.cart.splice(productIndexCart, 1);
  }
  if (productIndexWishlist !== -1) {
      user.wishlist.splice(productIndexWishlist, 1);
      console.log("Wishlist:", user.wish);
  }

  await user.save();
  res.redirect("back");
 

});


router.get('/cart', isLoggedIn, async function(req, res, next) {
   const user = await userModel.findOne({ username: req.session.passport.user });
   const product = await productModel.find()
    res.render('cart',{user, product});
});


router.get('/cart/:id', isLoggedIn, async function(req, res, next) {
  try {
      const userId = await userModel.findOne({ username: req.session.passport.user });
      const productId = req.params.id;
      const product = await productModel.findById(productId);
      const user = await userModel.findById(userId);

      const existingProductIndex = user.cart.findIndex(item => String(item.c_id) === productId);
      if (existingProductIndex !== -1) {
          return res.redirect("/product");
      }

      user.cart.push({
          c_name: product.p_name,
          c_image: product.p_image,
          c_description: product.p_description,
          c_price: product.p_price,
          c_id: product._id,
          c_quant: req.body.quant 
      });
      await user.save();
      res.redirect("/product");
  } catch (error) {
      console.error("Error adding product to cart:", error);
      res.status(500).send("Error adding product to cart");
  }
});

router.get('/wishlist', isLoggedIn, async function(req, res, next) {
  try {
    const user = await userModel.findOne({username: req.session.passport.user});
    res.render('wishlist', {user});
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});


router.get('/wishlist/:id',isLoggedIn,async function(req, res, next) {
  try {
    const productId = req.params.id;
    const product = await productModel.findById(productId);
    const user = await userModel.findOne({ username: req.session.passport.user });
    const existingProductIndex = user.wishlist.findIndex(item => String(item.w_id) === productId);
    if (existingProductIndex !== -1) {
        return res.redirect("/product");
    }

    user.wishlist.push({
      w_name: product.p_name,
      w_image: product.p_image,
      w_description: product.p_description, 
      w_id: product._id
    });
    await user.save();
    res.redirect("/product");
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});

router.get('/wpage/:id', isLoggedIn, async function(req, res, next) {
const pro = await productModel.findById(req.params.id)
console.log(pro);
   res.render('wpage',{pro});
});


router.post('/register', function(req, res, next) {
  const userData = new userModel({
    username: req.body.username,
    email: req.body.email,
  });
  userModel.register(userData, req.body.password)
    .then((result)=> {
      passport.authenticate("local")(req, res, ()=> {
        res.redirect("/product");
      });
    })
    .catch((err)=> {
      res.send(err);
    });
});

router.post('/login', passport.authenticate("local", {
  successRedirect: "/product",
  failureRedirect: "/login"
}));

router.get('/logout', (req, res, next) => {
  if (req.isAuthenticated())
    req.logout((err) => {
      if (err) res.send(err);
      else res.redirect('/');
    });
  else {
    res.redirect('/');
  }
});

function isLoggedIn(req, res, next){
  if(req.isAuthenticated()) return next();
  res.redirect("/login");
}
module.exports = router;
