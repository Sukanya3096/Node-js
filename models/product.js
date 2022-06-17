const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const productSchema = new Schema({
  title: {
    type: String,
    required: true,
  },

  price: {
    type: Number,
    required: true,
  },

  description: {
    type: String,
    required: true,
  },

  imageUrl: {
    type: String,
    required: true,
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
});

module.exports = mongoose.model("Product", productSchema);

// //file system

// // const fs = require('fs');
// // const path = require('path');
// // const rootDir = require('../util/path')

// // const p = path.join(rootDir,'data','products.json');

// // const getProductsFromFile = (callBack) => {
// //     fs.readFile(p, (err, fileContent) => {
// //         if(err) {
// //             return callBack([]);
// //         }
// //        callBack(JSON.parse(fileContent))
// //     })
// // }

// const db = require('../util/database');
// const Cart = require('./cart');

// module.exports = class Product {
//     constructor(id, title, imageUrl, price, description) {
//         this.id = id;
//         this.title = title;
//         this.imageUrl = imageUrl;
//         this.description = description;
//         this.price = price;
//     }

//     save() {
//         // file system

//         // getProductsFromFile(products => {
//         //     if (this.id) {
//         //     const existingProductIndex = products.find(el => el.id === this.id);
//         //     const updatedProducts = [...products];
//         //     updatedProducts[existingProductIndex] = this;

//         //     fs.writeFile(p, JSON.stringify(updatedProducts), (err) => {
//         //         console.log(err)
//         //     })
//         //     } else {
//         //         this.id = Math.random().toString();
//         //         products.push(this);
//         //         fs.writeFile(p, JSON.stringify(products), (err) => {
//         //             console.log(err)
//         //         })
//         //     }

//         // })

//         //database

//         return db.execute('INSERT INTO products(title, price, description, imageUrl) VALUES (?, ?, ?, ?)',
//          [this.title, this.price, this.description, this.imageUrl])

//     }
//     static deleteProduct(id) {
//         //file system

//         // getProductsFromFile(products => {
//         //     const product = products.find(el => id === el.id)
//         //     const updatedProducts = products.filter(el => el.id !== id);
//         //     fs.writeFile(p, JSON.stringify(updatedProducts), (err) => {
//         //         if (!err) {
//         //             Cart.deleteItem(id, product.price)
//         //         }
//         //     })
//         // })

//         //database
//     }
//     static fetchAll() {
//         //filesystem

//     //    getProductsFromFile(callBack)

//     //database

//     return db.execute('SELECT * FROM products');

//     }
//     static fetchProduct(id, callBack) {
//         //filesystem
//     //     getProductsFromFile(products => {
//     //         const product = products.find(el => el.id === id);
//     //         callBack(product);
//     //     })

//     //database
//     return db.execute('SELECT * FROM products WHERE products.id = ?',
//     [id])
//     }
// }

//using sql

// const Sequelize = require('sequelize');
// const sequelize = require('../util/database');

// const Product = sequelize.define('product',{
//     id: {
//         type: Sequelize.INTEGER,
//         autoIncrement: true,
//         allowNull: false,
//         primaryKey: true
//     },
//     title: Sequelize.STRING,
//     price: {
//         type: Sequelize.DOUBLE,
//         allowNull: false
//     },
//     imageUrl: {
//         type: Sequelize.STRING,
//         allowNull: false
//     },
//     description: {
//         type: Sequelize.STRING,
//         allowNull: false
//     }
// })

//using mongodb

// const getDb = require('../util/database').getDb;
// const mongoDb = require('mongodb')

// class Product {
//     constructor(title, price, imageUrl, description,id,userId) {

//         this.title = title;
//         this.imageUrl = imageUrl;
//         this.description = description;
//         this.price = price;
//         this._id = id ? new mongoDb.ObjectId(id) : null;
//         this.userId = userId
//     }

//     save() {
//         const db = getDb();
//         let dbOp;
//         if (this._id) {
//             dbOp = db.collection('products').updateOne({_id: this._id}, {$set: this})
//         } else {
//             dbOp =  db.collection('products').insertOne(this);
//         }
//        return dbOp;
//     }

//     static fetchAll() {
//         const db = getDb();
//         return db.collection('products').find().toArray()
//         .then(products => {
//             return products;
//         })
//         .catch(err => console.log(err))
//     }

//     static fetchProduct(id) {
//         const db = getDb();
//         return db.collection('products').find({_id: new mongoDb.ObjectId(id)}).next()
//         .then(product => {
//             console.log(product);
//             return product;
//         })
//         .catch(err => console.log(err));
//     }
//     static deleteProduct(id, userId) {
//         const db = getDb();
//         return db.collection('products').deleteOne({_id: new mongoDb.ObjectId(id)}).then((result) => {
//             return db.collection('users').updateOne(
//               { _id: new mongoDb.ObjectId(userId) },
//               {
//                 $pull: {
//                   'cart.items': { _id: new mongoDb.ObjectId(id) },
//                 },
//               }
//             );
//           })
//           .then((result) => {
//             console.log('Cart Item Deleted');
//           })
//           .then(() => {
//             console.log('Product Deleted');
//           });
//     }
// }
