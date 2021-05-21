var express = require('express');
const { response } = require('../app');
var router = express.Router();
var productHelpers = require('../helpers/product-helpers');
const userHelpers = require('../helpers/user-helpers');

var verifyLogin = (req,res,next)=>{
  if(req.session.admin){
    next()
  }else{
    res.redirect('/admin')
  }
}


/* GET users listing. */
router.get('/',async function(req, res) {
  let user = req.session.admin
  if(req.session.admin){
    let products = await productHelpers.getAllProducts();
    console.log(req.session)
    
    res.render('admin/view-products',{admin:true,products,user})
  }
  
  res.render('admin/admin-login',{admin:true,loginErr:req.session.adminloginErr,user})
  
});
router.post('/',(req,res)=>{
  let user = req.session.admin
  console.log(req.body);
  userHelpers.doAdminLogin(req.body).then((response)=>{
    if(response.status){
      req.session.admin = response.user
      req.session.adminloggedIn = true
      console.log(req.session);
      productHelpers.getAllProducts().then((products)=>{
        // res.render('admin/view-products',{admin:true,products,user})
        res.redirect('/admin')
      })

    }else{
      req.session.adminloginErr = true
      res.redirect('/admin')
      console.log(req.session);
    }
  })
})

router.get('/add-product',verifyLogin,(req,res)=>{
  res.render('admin/add-product',{admin:true,user:req.session.admin})
  console.log('add product called');
})





router.post('/add-product', function (req, res) {
  
  console.log(req.files);
  //code to add to database
  
  productHelpers.addProduct(req.body).then((id)=>{
    let img = req.files.image 
    img.mv('./public/images/product-images/' + id + '.jpg', (err, done) => {
      if (!err) {
        res.redirect('/admin/add-product');

      }else{
        console.log(err);
      }
    })
  }) 
})


router.get('/delete-product/:id',(req,res)=>{
  prodId = req.params.id;
  productHelpers.deleteProduct(prodId).then((response)=>{
    res.redirect('/admin')
  })

})

router.get('/edit-product/:id',verifyLogin,async(req,res)=>{
  let user = req.session.admin
  let product = await productHelpers.getProductDetails(req.params.id);
  res.render('admin/edit-product',{admin:true,product,user})
})

router.post('/edit-product/:id',(req,res)=>{
  productHelpers.updateProduct(req.params.id,req.body).then((resolve)=>{
    res.redirect('/admin')
    if(req.files.image){
      let id = req.params.id
      let img = req.files.image;
      img.mv('./public/images/product-images/' + id + '.jpg')
    }
  })
})

router.get('/all-users',verifyLogin,(req,res)=>{
  let user = req.session.admin
  userHelpers.getUsers().then((users)=>{
    // console.log(users);
    res.render('admin/all-users',{admin:true,users,user})
  })
})


router.get('/all-orders',verifyLogin,(req,res)=>{
  let user = req.session.admin
  userHelpers.getAllOrdersAdmin().then((orders)=>{
    
    
    res.render('admin/all-orders',{admin:true,orders,user})
  })
})

router.get('/logout',(req,res)=>{
  console.log(req.session);
  req.session.admin = null;
  res.redirect('/admin')
})

router.post('/shipped/:id',(req,res)=>{
  // console.log(req.params.id);
  userHelpers.changeOrderStatus(req.params.id).then((response)=>{
    res.json({status:true})
  })
})





module.exports = router;
