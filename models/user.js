const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const UserSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  resetToken: String,
  resetTokenExpiry: Date,
  cart: {
    items: [
      {
        productId: {
          type: Schema.Types.ObjectId,
          ref: "Product",
          required: true,
        },
        quantity: { type: Number, required: true },
      },
    ],
  },
});

UserSchema.methods.addToCart = function (product) {
  const cartProductIndex = this.cart.items.findIndex((cp) => {
    return cp.productId.toString() === product._id.toString();
  });
  let newQuantity = 1;
  const updatedCartItems = [...this.cart.items];

  if (cartProductIndex >= 0) {
    newQuantity = this.cart.items[cartProductIndex].quantity + 1;
    updatedCartItems[cartProductIndex].quantity = newQuantity;
  } else {
    updatedCartItems.push({
      productId: product._id,
      quantity: newQuantity,
    });
  }
  const updatedCart = {
    items: updatedCartItems,
  };
  this.cart = updatedCart;
  return this.save();
};

UserSchema.methods.removeFromCart = function (productId) {
  const updatedCartItems = this.cart.items.filter((item) => {
    return item.productId.toString() !== productId.toString();
  });
  this.cart.items = updatedCartItems;
  return this.save();
};

UserSchema.methods.clearCart = function () {
  this.cart = { items: [] };
  return this.save();
};

module.exports = mongoose.model("User", UserSchema);

// const Sequelize = require('sequelize');
// const sequelize = require('../util/database');

// const User = sequelize.define('user', {
//     id:{
//         type: Sequelize.INTEGER,
//         autoIncrement: true,
//         allowNull: false,
//         primaryKey: true
//     },
//     name: Sequelize.STRING,
//     email: Sequelize.STRING
// })

// const getDb = require('../util/database').getDb;
// const mongoDb = require('mongodb')

// class User {
//     constructor(username, email,cart, id) {
//         this.username = username;
//         this.email = email;
//         this.cart = cart;
//         this._id = new mongoDb.ObjectId(id);
//     }

//     save() {
//         const db = getDb();
//         return db.collection('users').insertOne(this);
//     }

// addToCart(product) {
//     console.log(this.cart.items)
//     const cartProductIndex = this.cart.items.findIndex(cp => {
//         return cp.productId.toString() === product._id.toString()
//     })

//     let newQuantity = 1;
//     const updatedCartItems = [...this.cart.items]

//     if(cartProductIndex >= 0) {
//         newQuantity = this.cart.items[cartProductIndex].quantity + 1;
//         updatedCartItems[[cartProductIndex]].quantity = newQuantity;
//     } else {
//         updatedCartItems.push({
//             productId: new mongoDb.ObjectId(product._id),
//             quantity: newQuantity
//         })
//     }

//         const updatedCart = {items:updatedCartItems};
//         const db = getDb();
//         return db.collection('users').updateOne({_id: this._id}, {$set: {cart: updatedCart}},{upsert: true})
//     }

//     getCart() {
//         const db = getDb();
//         const productIds = this.cart.items.map(el => el.productId)
//         return db.collection('products').find({_id: {$in: productIds}}).toArray()
//         .then(products => {
//             return products.map(p => {
//                 return {...p, quantity: this.cart.items.find(i => i.productId.toString() === p._id.toString()).quantity}
//             })
//         })
//     }

//     deleteCartItems(productId) {
//         const db = getDb();
//         const updatedCartItems = this.cart.items.filter(el => el.productId.toString() !== productId.toString())
//         return db.collection('users').updateOne({_id: this._id}, {$set: {cart: {items: updatedCartItems}}})
//     }

//     static findUserById(userId) {
//         const db = getDb();
//         return db.collection('users').findOne({_id: new mongoDb.ObjectId(userId)})
//     }

//     addOrder() {
//         const db = getDb();
//         return this.getCart()
//         .then(products => {
//             const order = {
//                 items: products,
//                 user: {
//                     _id: this._id,
//                     username: this.username
//                 }
//             }
//             return db.collection('orders').insertOne(order)
//         })
//         then(result => {
//             this.cart = {items: []};
//             return db.collection('users').updateOne({_id: this._id}, {$set: {cart: {items: []}}})
//         })

//     }

//     getOrders() {
//         const db = getDb();
//         return db.collection('orders').find({'user._id': this._id}).toArray();
//     }
// }
