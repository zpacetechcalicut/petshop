const { response, json } = require('express');
var express = require('express');
const session = require('express-session');
var router = express.Router();
const productHelpers = require('../helpers/product-helpers');
const userHelpers = require('../helpers/user-helpers');

const verifyLogin = (req, res, next) => {
  if(req.session.userLoggedIn){
    next()
  }else{
    res.redirect('/login')
  }
}

/* GET home page. */
router.get('/', async function(req, res, next) {
  let user = req.session.user
  console.log(user);
  let cartCount = null
  if(req.session.user){
    cartCount = await userHelpers.getCartCount(req.session.user._id)
  }
  productHelpers.getAllProducts().then((products) => {
    res.render('user/view-products', { products, user, cartCount })
  })
});

router.get('/login', (req, res) => {
  if(req.session.user){
    res.redirect('/')
  }else{
  res.render('user/login',{"loginErr":req.session.userLoginErr})
  req.session.userLoginErr = false
  }
})

router.get('/signup', (req, res) => {
  res.render('user/signup')
})

router.post('/signup', (req, res) => {
  userHelpers.doSignup(req.body).then((response) => {
    console.log(response);
    
    req.session.user = response
    req.session.user.loggedIn = true
    res.redirect('/')
  })
})

router.post('/login',(req, res) => {
  userHelpers.doLogin(req.body).then((response) => {
    if(response.status){
      
      req.session.user = response.user
      req.session.userLoggedIn = true
      res.redirect('/')
    }else{
      req.session.userLoginErr = "Invalid username or password"
      res.redirect('/login')
    }
  })
})

router.get('/logout', (req, res) => {
  req.session.user = null
  req.session.userLoggedIn = false
  res.redirect('/')
})

router.get('/cart', verifyLogin, async(req, res) => {
  let products = await userHelpers.getCartProducts(req.session.user._id)
  let totalValue = await userHelpers.getTotalAmount(req.session.user._id)
  // console.log(products);
  res.render('user/cart', {products, user:req.session.user, totalValue})
})

router.get('/add-to-cart/:id', verifyLogin, (req, res) => {
  userHelpers.addToCart(req.params.id, req.session.user._id).then(() => {
    res.json({status:true})
    // res.redirect('/')
  })
})

router.post('/change-product-quantity', (req, res, next) => {
  userHelpers.changeProductQuantity(req.body).then(async(response) => {
    response.total= await userHelpers.getTotalAmount(req.body.user)
    res.json(response)
  })
})

router.get('/delete-cart-item/:id', (req, res, next) => {
  userHelpers.deleteCartItem(req.params.id, req.session.user._id).then((response) => {
    // console.log(req.params.id);
    res.redirect('/cart')
  })
})

router.get('/place-order', verifyLogin,async(req, res) => {
  // let product = await userHelpers.getCartProductList(req.body.user)
  let total= await userHelpers.getTotalAmount(req.session.user._id)
  res.render('user/place-order',{total,user:req.session.user})
})

router.post('/place-order', async(req, res) => {
  let products = await userHelpers.getCartProductList(req.body.userId)
  let totalPrice = await userHelpers.getTotalAmount(req.body.userId)
  console.log(products, totalPrice);
  userHelpers.placeOrder(req.body, products, totalPrice)
  res.render('user/order-success', {user:req.session.user})
})


router.get('/orders', async(req, res) => {
  let orders = await userHelpers.getUserOrders(req.session.user._id)
  res.render('user/orders', {user:req.session.user, orders})
})

router.get('/view-order-products/:id', async(req, res) => {
  let products = await userHelpers.getOrderProducts(req.params.id)
  res.render('user/view-order-products', {user:req.session.user, products})
})

// router.post('/verify-payment', (req, res) => {
//   console.log(req.body);
// })

router.get('/edit-profile', async(req, res) => {
  let user = await userHelpers.getUserDetails(req.session.user._id)
  res.render('user/edit-profile',{user, user:req.session.user})
})

router.post('/edit-profile', async(req, res) => {
  userHelpers.editProfile(req.session.user._id, req.body)
  products = await productHelpers.getAllProducts()
  res.render('user/view-products', {products, user:req.session.user})

})

router.get('/categories', async(req,res) => {
  let categories = await userHelpers.getAllCategories()
  res.render('user/categories', {categories, user:req.session.user})
})

router.get('/category-products/:id', async(req, res) => {
  // console.log(req.params.id);
  let category_products = await productHelpers.categoryProducts(req.params.id)
  res.render('user/category-products',{category_products, user:req.session.user})
})


module.exports = router;
