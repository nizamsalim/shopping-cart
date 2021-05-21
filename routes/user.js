var express = require('express');
const { Logger } = require('mongodb');
const productHelpers = require('../helpers/product-helpers');
const userHelpers = require('../helpers/user-helpers');
var router = express.Router();
var verifyLogin = (req,res,next)=>{
  if(req.session.user){
    next()
  }else{
    res.redirect('/login')
  }
}

/* GET home page. */
router.get('/', async function(req, res, next) {
  let user = req.session.user
  //code to get product list from db
  let cartCount = null
  if(user){
    cartCount = await userHelpers.getCartCount(user._id)
  }
  

  productHelpers.getAllProducts().then((products)=>{
    // console.log(products);

    res.render('user/view-products',{user,products,cartCount})
  })
});


router.get('/login',function(req,res){
  if(req.session.user ){
    res.redirect('/')
  }else{

    res.render('user/user-login',{loginErr:req.session.userloginErr})
    req.session.userloginErr = false
  }
  
})

router.post('/login',(req,res)=>{
  userHelpers.doLogin(req.body).then((response)=>{
    if(response.status){
      
     
      req.session.user = response.user
      req.session.user.loggedIn = true;
      // console.log(req.session)
      console.log(response.user);
      res.redirect('/')
    }else{
      req.session.userloginErr = true;
      res.redirect('/login')
    }
  })
});

router.get('/logout',(req,res)=>{
  req.session.user = null
  res.redirect('/'); 
})

router.get('/signup',(req,res)=>{
  res.render('user/user-signup')
})

router.post('/signup',function(req,res){
  userHelpers.doSignup(req.body).then((response=>{
    console.log(response);
    
    req.session.user = response
    req.session.user.loggedIn = true;
    console.log(req.session);
    res.redirect('/') 
    
  }))
})

router.get('/cart',verifyLogin,async(req,res)=>{
  let user = req.session.user;
  let products = await userHelpers.getCartProducts(user._id);
  let cartTotal = await userHelpers.getCartTotal(user._id)
  console.log(products,cartTotal);
  res.render('user/cart',({user,products,cartTotal}))
  
  
})

router.get('/orders',verifyLogin,async(req,res)=>{
  let user = req.session.user;
  // console.log(user);
  let orders = await userHelpers.getOrders(user._id)
  res.render('user/orders',{orders,user})
})


  


router.get('/add-to-cart/:id',(req,res)=>{
  
  if (req.session.user.loggedIn){
    // console.log(req.session);
    // res.json({status:true})
    userHelpers.addToCart(req.params.id,req.session.user._id).then(()=>{
      res.json({status:true})
    })
  }else{
    res.json({status:false})
  }

  
  
  
})


router.post('/change-product-quantity/',(req,res)=>{
  // console.log('Api call');
  // console.log(req.body);
  userHelpers.changeProductQuantity(req.body).then(async(response)=>{
    // console.log(response);
    response.cartTotal = await userHelpers.getCartTotal(req.body.user)
    res.json(response)
    
  })
});
  
  

router.post('/remove-product',(req,res)=>{
  userHelpers.removeFromCart(req.body).then((response)=>{
    res.json(response)
  })
})

router.get('/place-order',verifyLogin,async(req,res)=>{
  let user = req.session.user
  let cartTotal = await userHelpers.getCartTotal(user._id)
  
  res.render('user/place-order',{user,cartTotal})
})

router.post('/place-order',async(req,res)=>{
  
  let products = await userHelpers.getCartProductsList(req.body.userId)
  let cartTotal = await userHelpers.getCartTotal(req.body.userId)

  console.log(req.body);
  userHelpers.placeOrder(req.body,products,cartTotal).then((status)=>{
    res.json({payment:req.body.payment})
  })
  // console.log(req.body);
})

router.get('/order-placed',(req,res)=>{
  let user = req.session.user
  res.render('user/order-placed',{user})
})

router.get('/order-summary/:id',verifyLogin,(req,res)=>{
  let user = req.session.user
  // console.log('order summary req');
  // console.log(req.params.id);
  userHelpers.getOrderSummary(req.params.id).then((orders)=>{
    console.log(orders[0].products);
    
        // console.log(orders[0].products);
        res.render('user/order-summary',{orders,user})
        
    })
});

router.get('/profile',verifyLogin,(req,res)=>{
  let user = req.session.user
  res.render('user/profile',{user})
})




module.exports = router;
