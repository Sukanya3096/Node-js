// const sql = require('mysql2');
// const env = require("dotenv").config();
// const MONGODB_URI = process.env.MONGO_URL;

// const pool = sql.createPool({
//     host: 'localhost',
//     user: 'root',
//     database: 'shop',
//     password: 'Sukanya@30'
// });

// module.exports = pool.promise()

//this was for sql

// const Sequelize = require('sequelize').Sequelize;
// const sequelize = new Sequelize('shop','root', 'Sukanya@30',
// {dialect: 'mysql', host: 'localhost'})

// module.exports = sequelize;

//for mongodb

// const mongodb = require('mongodb');
// const MongoClient = mongodb.MongoClient;

// let _db;

// const mongoConnect = (callBack) => {
//     MongoClient.connect(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
//     .then(client => {
//         _db = client.db();
//         callBack()
//     })
//     .catch(err => {
//         console.log(err);
//         throw err;
//     })
// }

// const getDb = () => {
//     if(_db) {
//         return _db
//     }
//     throw 'No Database Found!'
// }

// exports.mongoConnect = mongoConnect;
// exports.getDb = getDb;
