var db = require('../config/connection');
var collection = require('../config/collections')
const bcrypt = require('bcrypt');
const { USER_COLLECTION } = require('../config/collections');
const { response } = require('../app');
const collections = require('../config/collections');
var objectId = require('mongodb').ObjectID;
const { BadGateway } = require('http-errors');


module.exports = {
    doSignup: (userData) => {
        let response={}
        return new Promise(async (resolve, reject) => {

            userData.password = await bcrypt.hash(userData.password, 10);
            db.get().collection(collection.USER_COLLECTION).insertOne(userData).then((data) => {
                
                // user={}
                // user.name = data.ops[0].name
                // user.email = data.ops[0].email                     
                // response.user = user
                // resolve(response)
                console.log(data.ops[0]);
                resolve(data.ops[0])
            })
        })
    },

    doAdminLogin:(userData)=>{
        return new Promise((resolve,reject)=>{
            let username = 'admin'
            let password = 'admin'
            let response = {}
            if(userData.username === username && userData.password === password){
                response.status = true
                response.user = {username:'admin',password:'password'}
                resolve(response)
            }else{
                response.status = false
                resolve(response)
            }
        })
        
    },

    doLogin: (userData) => {
        return new Promise(async (resolve, reject) => {
            var response = {}
            user = await db.get().collection(USER_COLLECTION).findOne({ email: userData.email })
            if (user) {
                bcrypt.compare(userData.password, user.password).then((stat) => {
                    if (stat) {
                        // console.log('login success');
                        response.user = user;
                        response.status = true;

                        resolve(response)
                    } else {
                        // console.log('login failed');
                        resolve({ status: false })
                    }
                })
            } else {
                // console.log('login failed');
                resolve({ status: false })
            }
        })
    },

    

    getUsers: () => {
        return new Promise(async (resolve, reject) => {
            let users = await db.get().collection(collections.USER_COLLECTION).find().toArray()
            resolve(users)
        })
    },

    addToCart: (prodId, userId) => {
        // console.log(userId);
        prodObj = {
            item: objectId(prodId),
            quantity: 1
        }
        return new Promise(async (resolve, reject) => {
            let userCart = await db.get().collection(collections.CART_COLLECTION).findOne({ user: objectId(userId) })
            if (userCart) {
                let proExist = userCart.products.findIndex(product => product.item == prodId)
                // console.log(proExist);
                if (proExist != -1) {
                    db.get().collection(collections.CART_COLLECTION)
                    .updateOne({user:objectId(userId) ,'products.item': objectId(prodId) },
                        {
                            $inc: { 'products.$.quantity': 1 }
                        }).then(() => {
                            resolve()
                        })
                } else {
                    db.get().collection(collections.CART_COLLECTION).
                        updateOne({ user: objectId(userId) }, {

                            $push: { products: prodObj }

                        }).then((response) => {
                            resolve()
                        })
                }
            } else {
                let cartObj = {
                    user: objectId(userId),
                    products: [prodObj]
                }
                db.get().collection(collections.CART_COLLECTION).insertOne(cartObj).then(() => {
                    resolve()
                })
            }
        })
    },

    getCartProducts: (userId) => {  
        return new Promise(async (resolve, reject) => {
            let cartItems = await db.get().collection(collections.CART_COLLECTION).aggregate([
                {
                    $match: { user: objectId(userId) }
                },
                {
                    $unwind:'$products'
                },
                {
                    $project:{
                        item:'$products.item',
                        quantity:'$products.quantity'
                    }
                },
                {
                    $lookup:{
                        from:collections.PRODUCT_COLLECTION,
                        localField:'item',
                        foreignField:'_id',
                        as:'product'
                    }
                },
                {
                    $project:{
                        item:1,quantity:1,product:{$arrayElemAt:['$product',0]}
                    }
                }
                

            ]).toArray()
            // console.log(cartItems);
            if (typeof cartItems == undefined){
                reject(false)
            }else{
                resolve(cartItems)
            }
            


        })
    },

    getCartCount: (userId) => {
        let count = 0
        return new Promise(async (resolve, reject) => {
            let cart = await db.get().collection(collections.CART_COLLECTION).findOne({ user: objectId(userId) })
            if (cart) {
                count = cart.products.length;
            }
            resolve(count)
        })
    },

    changeProductQuantity:(data)=>{
        // console.log(data);
        
        quantity = parseInt(data.quantity)
        count = parseInt(data.count)
        return new Promise((resolve,reject)=>{
            if(count == -1 && quantity ==1){
                db.get().collection(collections.CART_COLLECTION).updateOne({_id:objectId(data.cart)},
                {
                    $pull:{products:{item:objectId(data.product)}}
                }
                ).then((response)=>{
                    resolve({removeProduct:true})
                })
            }else{
                db.get().collection(collections.CART_COLLECTION).
                updateOne({_id:objectId(data.cart) ,'products.item': objectId(data.product) },
                {
                    $inc: { 'products.$.quantity': count }
                }
                ).then((response)=>{
                    
                    resolve({status:true})
                })
                
            }
           
        })
    },

    removeFromCart:(data)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collections.CART_COLLECTION).updateOne({_id:objectId(data.cart)},
                {
                    $pull:{products:{item:objectId(data.product)}}
                }
                ).then((response)=>{
                    resolve(true)
                })
        })
    },

    

    getCartTotal:(userId)=>{
        return new Promise(async (resolve, reject) => {
            let cartTotal = await db.get().collection(collections.CART_COLLECTION).aggregate([
                {
                    $match: { user: objectId(userId) }
                },
                {
                    $unwind:'$products'
                },
                {
                    $project:{
                        item:'$products.item',
                        quantity:'$products.quantity'
                    }
                },
                {
                    $lookup:{
                        from:collections.PRODUCT_COLLECTION,
                        localField:'item',
                        foreignField:'_id',
                        as:'product'
                    }
                },
                {
                    $project:{
                        item:1,quantity:1,product:{$arrayElemAt:['$product',0]}
                    }
                },
                
                {
                   
                   $group:{
                       _id:null,
                       total:{$sum:{$multiply:['$quantity','$product.price']}}
                   }
                }
                

            ]).toArray()
            // console.log(cartTotal);
            if(cartTotal.length!=0){
                resolve(cartTotal[0].total)
            }else{
                resolve(0)
            }
            
            
            


        })
    },
    getCartProductsList:(userId)=>{
        // console.log(userId);
        // return new Promise(async(resolve,reject)=>{
        //     let cart = await db.get().collection(collections.CART_COLLECTION).findOne({ user: objectId(userId) })
        //     console.log(cart.products);
        //     resolve(cart.products)
            
        // })
        return new Promise(async (resolve, reject) => {
            let cartItems = await db.get().collection(collections.CART_COLLECTION).aggregate([
                {
                    $match: { user: objectId(userId) }
                },
                {
                    $unwind:'$products'
                },
                {
                    $project:{
                        item:'$products.item',
                        quantity:'$products.quantity'
                    }
                },
                {
                    $lookup:{
                        from:collections.PRODUCT_COLLECTION,
                        localField:'item',
                        foreignField:'_id',
                        as:'product'
                    }
                },
                {
                    $project:{
                        item:1,quantity:1,product:{$arrayElemAt:['$product',0]}
                    }
                }
                

            ]).toArray()
            // console.log(cartItems);
            resolve(cartItems)


        })
    },

    placeOrder:(order,products,totalPrice)=>{
        return new Promise((resolve, reject) => {
            let status = 'placed'
            let date = new Date(); 
            var orderDate = date.getDate()+"/"+(date.getMonth()+1)+'/'+date.getFullYear()
            if((date.getDate()+7)>31){
                var deliveryDate = '1'+'/' + (date.getMonth()+20)+'/'+date.getFullYearYear()
            }else{
            var deliveryDate = (date.getDate()+4)+"/"+(date.getMonth()+1)+'/'+date.getFullYear()
            }
            let orderObj = {
                userId: objectId(order.userId),
                deliveryDetails: {
                    mobile: order.mobile,
                    address: order.address1,
                    pin: order.pin,
                    state: order.state,
                    
                },
                date:orderDate,
                dateOfDelivery:deliveryDate,
                paymentMethod: order.payment,
                products: products,
                totalPrice: totalPrice,
                status: status,
            }
            db.get().collection(collections.ORDER_COLLECTION).insertOne(orderObj).then((response) => {
                // console.log(response.ops[0]);
                db.get().collection(collections.CART_COLLECTION).removeOne({user:objectId(orderObj.userId)})
                resolve()
            })
        })
        
        
    },

    getAllOrdersAdmin:()=>{
        return new Promise((resolve,reject)=>{
            let orders = db.get().collection(collections.ORDER_COLLECTION).find().toArray();
            resolve(orders)
        })
        
    },
    getOrders:(userIDD)=>{
        // console.log(userIDD);
        return new Promise(async(resolve,reject)=>{
            let orders = await db.get().collection(collections.ORDER_COLLECTION).find({userId:objectId(userIDD)}).toArray()
            // console.log(orders);
            resolve(orders)
        })
    },

    getOrderSummary:(orderId)=>{
        return new Promise(async(resolve,reject)=>{
            let orders = await db.get().collection(collections.ORDER_COLLECTION).find({_id:objectId(orderId)}).toArray()
            // console.log(orders);
            resolve(orders)
        })
    },

    changeOrderStatus:(orderId)=>{
        // console.log(orderId);
        return new Promise((resolve,reject)=>{
            db.get().collection(collections.ORDER_COLLECTION).updateOne({_id:objectId(orderId)},
            {
                $set:{status:'shipped'}
            }).then(()=>{
                resolve(true)
                
            })
            
    })
    },
    



}