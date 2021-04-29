const { resolve, reject } = require('promise')
var db = require('../config/connection')
var collection = require('../config/collections')
var objectId = require('mongodb').ObjectID
const { response } = require('express')
const bcrypt = require('bcrypt')
const { compare } = require('bcrypt')

module.exports = {

    doLogin: (adminData) => {
        return new Promise(async(resolve, reject) => {
            let loginStatus = false
            let response = {}
            let admin = await db.get().collection(collection.ADMIN_LOG).findOne({Email:adminData.Email})
            if(admin){
                bcrypt.compare(adminData.Password, admin.Password).then((status) => {
                    if(status){
                        // console.log('login success');
                        response.admin = admin
                        response.status = true
                        resolve(response)
                    }else{
                        // console.log('login fail');
                        resolve({status:false})
                    }
                })
            }else{
                // console.log('login failed');
                resolve({status:false})
            }
        })
    },

    addProduct:(product, callback) => {
        db.get().collection(collection.PRODUCT_COLLECTION).insertOne(product).then((data) => {
            callback(data.ops[0]._id)
        })
    },

    addCategory:(category) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.CATEGORY_COLLECTION).insertOne(category).then((data) => {
                resolve(data.ops[0])
            })
            
        })
    },

    getAllCategories:() => {
        return new Promise(async(resolve, reject) => {
            let categories = await db.get().collection(collection.CATEGORY_COLLECTION).find().toArray()
            resolve(categories)
        })
    },

    categoryProducts:(catId) => {
        return new Promise(async(resolve, reject) => {
            let category = await db.get().collection(collection.CATEGORY_COLLECTION).findOne({_id:objectId(catId)})
            let category_products = db.get().collection(collection.PRODUCT_COLLECTION).find({Category:category.Category}).toArray()
            resolve(category_products)
        })
    },

    getAllProducts:() =>{
        return new Promise(async(resolve, reject) => {
            let products = await db.get().collection(collection.PRODUCT_COLLECTION).find().toArray()
            resolve(products)
        })
    },

    deleteProduct:(prodId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.PRODUCT_COLLECTION).removeOne({_id:objectId(prodId)}).then((response) => {
                console.log(response);
                resolve(response)
            })
        })
    },

    getProductDetails:(prodId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.PRODUCT_COLLECTION).findOne({_id:objectId(prodId)}).then((product) => {
                resolve(product)
            })
        })
    },

    updateProduct:(prodId, proDetails) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.PRODUCT_COLLECTION)
            .updateOne({_id:objectId(prodId)}, {
                $set:{
                    Name:proDetails.Name,
                    Category:proDetails.Category,
                    Price:proDetails.Price,
                    Description:proDetails.Description
                }
            }).then((response) => {
                resolve()
            })
        })
    },

    getAllOrders:() =>{
        return new Promise(async(resolve, reject) => {
            let orders = await db.get().collection(collection.ORDER_COLLECTION).find().toArray()
            resolve(orders)
        })
    },

    getOrderProducts:(orderId) => {
        return new Promise(async(resolve, reject) => {
            let orderItems = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
                {
                    $match:{_id:objectId(orderId)}
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
                        from:collection.PRODUCT_COLLECTION,
                        localField:'item',
                        foreignField:'_id',
                        as:'product'
                    }
                },
                {
                    $project:{
                        item:1, quantity:1, product:{$arrayElemAt:['$product',0]}
                    }
                }
            ]).toArray()
            resolve(orderItems)
        })
    },

    getAllUsers:() => {
        return new Promise(async(resolve, reject) => {
            let users = await db.get().collection(collection.USER_COLLECTION).find().toArray()
            resolve(users)
        })
    },

    getAdminDetails:(admId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.ADMIN_LOG).findOne({_id:objectId(admId)}).then((adm) => {
                resolve(adm)
            })
        })
    },

    changePassword:(admId, admDetails) => {
        return new Promise(async(resolve, reject) => {
            let admin = await db.get().collection(collection.ADMIN_LOG).findOne({_id:objectId(admId)})
            if(admin) {
                bcrypt.compare(admDetails.cPassword, admin.Password).then(async(status) => {
                    if(status) {
                        admDetails.Password = await bcrypt.hash(admDetails.Password, 10)
                        db.get().collection(collection.ADMIN_LOG)
                        .updateOne({_id:objectId(admId)}, {
                            $set:{
                                Name:admDetails.Name,
                                Email:admDetails.Email,
                                Password:admDetails.Password
                            }
                        }).then((response) => {
                            // resolve()
                            response.admin = admin
                            response.status = true
                            resolve(response)
                        })
                    }else{
                        resolve({status:false})
                    }
                })
            }
        })
    }


}