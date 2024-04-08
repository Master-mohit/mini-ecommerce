var express = require('express');
var router = express.Router();
const userModel = require("./users");
const productModel = require("./pro");
const uploads = require("./multer");
const passport = require("passport");
const localStrategy = require("passport-local");
const pro = require('./pro');
const upload = require('./multer');
passport.use(new localStrategy(userModel.authenticate()));

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

router.get('/create',isLoggedIn, async function(req, res, next) {
  const user = await userModel.findOne({username: req.session.passport.user})
  res.render('create', {user});
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
  
    res.redirect("/main");
  } catch (err) {
    console.error(err);
    res.status(500).send('Internal Server Error');
  }
});

router.get('/main', isLoggedIn, async function(req, res, next) {
  try {
    const products = await productModel.find();
    res.render('main', { products });
  } catch (err) {
    console.error(err);
    res.status(500).send('Internal Server Error');
  }
});



router.get('/login', function(req, res, next) {
  res.render('login');
});


router.get('/cpage/:id',isLoggedIn, async function(req, res, next) {
   const prod = await productModel.findById(req.params.id)
  res.render('cpage',{prod});
});

router.get('/cart', isLoggedIn, async function(req, res, next) {
   const user = await userModel.findOne({ username: req.session.passport.user });
    res.render('cart',{user});
});


router.get('/cart/:id' ,isLoggedIn, upload.single("image"), async function(req, res, next) {
  const userId = await userModel.findOne({username: req.session.passport.user}) 
  const productId = req.params.id;
  const product = await productModel.findById(productId);


  const user = await userModel.findById(userId);
  
  user.cart.push({
    c_name: product.p_name,
    c_image: product.p_image,
    c_description: product.p_description,
    c_price: product.p_price,
  });

 
  await user.save();
 
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


router.get('/wishlist/:id',isLoggedIn, upload.single("image"),async function(req, res, next) {
 const pro = req.params.id
 const product = await productModel.findById(pro)
 const user = await userModel.find({username: req.session.passport.user})
 const userid = await userModel.findById(user)

 userid.wishlist.push({
  w_name: product.p_name,
  w_image: product.p_image,
  w_description: product.p_description,
 })
 await userid.save();
});

router.get('/wpage/:id', isLoggedIn, async function(req, res, next) {
const pro = productModel.findById(req.params.id)
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
        res.redirect("/create");
      });
    })
    .catch((err)=> {
      res.send(err);
    });
});

router.post('/login', passport.authenticate("local", {
  successRedirect: "/create",
  failureRedirect: "/login"
}));

// GET logout route
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
