const { response } = require('express');
var express = require('express');
const productHelpers = require('../helpers/product-helpers');
var router = express.Router();
var productHelper = require('../helpers/product-helpers');
const session = require('express-session');

const verifyLogin = (req, res, next) => {
  if(req.session.adminLoggedIn){
    next()
  }else{
    res.redirect('/admin', {admin:true})
  }
}



/* GET users listing. FIRST ONE */
// router.get('/', function(req, res, next) {
//   productHelpers.getAllProducts().then((products) => {
//     console.log(products)
//     res.render('admin/login',{ products, admin:true });
//   })
  

router.get('/', function(req, res, next) {
  if(req.session.admin){
    res.redirect('/view-products',{ admin:true })
  }else{
    res.render('admin/login', {"loginErr":req.session.adminLoginErr, admin:true })
    req.session.adminLoginErr = false
  }
})

//   router.get('/login', (req, res) => {
//     if(req.session.admin){
//       res.redirect('/')
//     }else{
//     res.render('admin/login',{"loginErr":req.session.adminLoginErr})
//     req.session.adminLoginErr = false
//     }
//   })
// })

// router.get('/signup-admin', (req, res) => {
//   res.render('admin/signup', {admin:true})
// })

// router.post('/signup-admin', async(req, res) => {
//   console.log(req.body);
//   let products = await productHelpers.getAllProducts()
//   productHelpers.doSignup(req.body).then((response) => {
//     // console.log(response);
    
//     req.session.admin = response
//     req.session.admin.loggedIn = true
    
//     res.render('admin/view-products',{products, admin:true})
//   })
// })

router.post('/login-admin', async(req, res) => {
  let products = await productHelpers.getAllProducts()
  productHelpers.doLogin(req.body).then((response) => {
    if(response.status){
      
      req.session.admin = response.admin
      req.session.adminLoggedIn = true
      res.render('admin/view-products',{products, admin:true})
      
    }else{
      req.session.adminLoginErr = "Invalid username or password"
      res.redirect('/admin')
    }
  })
})

router.get('/logout-admin', (req, res) => {
  req.session.admin = null
  req.session.adminLoggedIn = false
  res.redirect('/admin')
})

router.get('/all-products', verifyLogin, async(req,res) => {
  let products = await productHelpers.getAllProducts()
  res.render('admin/view-products',{products, admin:req.session.admin})
})

router.get('/categories', verifyLogin, async(req,res) => {
  let categories = await productHelpers.getAllCategories()
  res.render('admin/categories', {categories, admin:req.session.admin})
})

router.get('/category-products/:id', verifyLogin, async(req, res) => {
  // console.log(req.params.id);
  let category_products = await productHelpers.categoryProducts(req.params.id)
  res.render('admin/category-products',{category_products, admin:req.session.admin})
})

router.get('/all-orders', verifyLogin, async(req,res) => {
  let orders = await productHelpers.getAllOrders()
  res.render('admin/all-orders', {orders, admin:req.session.admin})
})

router.get('/view-order-products/:id', async(req, res) => {
  let products = await productHelpers.getOrderProducts(req.params.id)
  res.render('admin/view-order-products', {products, admin:req.session.admin})
})

router.get('/all-users', verifyLogin, async(req, res) => {
  let users = await productHelpers.getAllUsers()
  res.render('admin/all-users',{users, admin:req.session.admin})
})

router.get('/change-password', verifyLogin, async(req, res) => {
  let adm = await productHelpers.getAdminDetails(req.session.admin._id)
  res.render('admin/change-password', {"passwordErr":req.session.adminchangePasswordErr, adm, admin:req.session.admin})
  req.session.adminchangePasswordErr = false
})

router.post('/change-password', (req, res) => {
  productHelpers.changePassword(req.session.admin._id, req.body).then(() => {
    if(response.status){
      req.session.admin = null
      req.session.adminLoggedIn = false
      res.redirect('/admin')
    }else{
      req.session.adminchangePasswordErr = "Incorrect Password"
      res.redirect('/change-password')
    }
  })
})

router.get('/add-product', verifyLogin, async(req, res) => {
  let categories = await productHelpers.getAllCategories()
  res.render('admin/add-product',{categories, admin:req.session.admin})
})

router.post('/add-product', async(req, res) => {
let categories = await productHelpers.getAllCategories()
  productHelpers.addProduct(req.body, (id) => {
    let image = req.files.Image
    image.mv('./public/product-images/'+id+'.jpg',(err) => {
      if(!err){
        res.render('admin/add-product', {categories, admin:req.session.admin})
      }else{
        console.log(err);
      }
    })    
  })
})

router.get('/add-category', async(req, res) => {
  res.render('admin/add-category', {admin:req.session.admin})
})

router.post('/add-category', (req, res) => {
  productHelpers.addCategory(req.body)
    res.render('admin/add-category', {admin:req.session.admin})
  
})

router.get('/delete-product/:id', verifyLogin, (req,res) => {
  let proId = req.params.id
  // console.log(proId); 
  productHelpers.deleteProduct(proId).then(async(response) => {
    let products = await productHelpers.getAllProducts()
    res.render('admin/view-products',{products, admin:req.session.admin})
  })
})

router.get('/edit-product/:id', verifyLogin, async(req,res) => {
  let categories = await productHelpers.getAllCategories()
  let product = await productHelpers.getProductDetails(req.params.id)
  res.render('admin/edit-product',{ product, categories, admin:req.session.admin })
})


router.post('/edit-product/:id', async(req, res) => {
  let id = req.params.id

  productHelpers.updateProduct(req.params.id, req.body).then(async() => {
    let products = await productHelpers.getAllProducts()
    res.render('admin/view-products',{products, admin:req.session.admin})
    if(req.files.Image){
      let image = req.files.Image
      image.mv('./public/product-images/'+id+'.jpg')
    }
  })
})

module.exports = router;
