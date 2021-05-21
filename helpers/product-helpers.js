var db = require('../config/connection')
var collection = require('../config/collections')
var objectId = require('mongodb').ObjectID
const { Collection } = require('mongoose')
const collections = require('../config/collections')
const { ObjectId } = require('bson')
const { response } = require('../app')

module.exports = {

    addProduct:(product)=>{
        return new Promise((resolve,reject)=>{
            let price = product.price;
            price = parseInt(price)
            product.price = price;
            console.log(product);
            db.get().collection('product').insertOne(product).then((data)=>{
                resolve(data.ops[0]._id)
        })
        
        })
    },
    

    getAllProducts:()=>{
        return new Promise(async(resolve,reject)=>{
            let products = await db.get().collection(collection.PRODUCT_COLLECTION).find().toArray()
            resolve(products)
        })
    },

    deleteProduct:(prodId)=>{
        return new Promise(async(resolve,reject)=>{
            db.get().collection(collection.PRODUCT_COLLECTION).removeOne({_id:objectId(prodId)}).then((response)=>{
                resolve(response)
            })
            
        })
    },

    getProductDetails:(prodId)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collections.PRODUCT_COLLECTION).findOne({_id:ObjectId(prodId)}).then((product)=>{
                resolve(product);
            })

        })
    },

    updateProduct:(prodId,prodDetails)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collections.PRODUCT_COLLECTION).
            updateOne({_id:ObjectId(prodId)},{
                $set:{
                    name:prodDetails.name,
                    desc:prodDetails.desc,
                    price:prodDetails.price,
                    category:prodDetails.category,

                }
            }).then((response)=>{
                resolve()
            })
        })
    },

    
}