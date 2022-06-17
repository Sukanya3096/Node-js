const express = require("express");
const bodyParser = require("body-parser");
const session = require("express-session");
const path = require("path");
const morgan = require('morgan');
const fs = require('fs')
const multer = require("multer");
const errorController = require("./controllers/error");
const User = require("./models/user");
const MongoDbStore = require("connect-mongodb-session")(session);
const csrf = require("csurf");
const compression = require('compression');
const helmet = require("helmet");
const env = require("dotenv").config();
const MONGODB_URI = process.env.MONGO_URL;

const flash = require("connect-flash");

const app = express();
const store = new MongoDbStore({ uri: MONGODB_URI, collection: "sessions" });
const csrfProtection = csrf();
const fileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "images");
  },
  filename: (req, file, cb) => {
    cb(null, new Date().toISOString() + "-" + file.originalname);
  },
});
const fileStream = fs.createWriteStream(path.join(__dirname,'access.log'), {
  flags: 'a'
})
const fileFilter = (req, file, cb) => {
  if (
    file.mimetype === "image/png" ||
    file.mimetype === "image/jpg" ||
    file.mimetype === "image/jpeg"
  ) {
    cb(null, true);
  } else {
    cb(null, false);
  }
};

// app.set('view engine', 'pug');

app.set("view engine", "ejs");
app.set("views", "views");
// db.execute('SELECT * FROM products').then(res => console.log(res))
app.use(bodyParser.urlencoded({ extended: false }));
app.use(
  multer({ storage: fileStorage, fileFilter: fileFilter }).single("image")
);
app.use(morgan('combined', {stream: fileStream}))
app.use(compression())
app.use(
  session({
    secret: "my secret",
    resave: false,
    saveUninitialized: false,
    store: store,
  })
);
app.use(csrfProtection);
app.use((req, res, next) => {
  res.locals.isAuthenticated = req.session.isLoggedIn;
  res.locals.csrfToken = req.csrfToken();

  next();
});
app.use((req, res, next) => {
  if (!req.session.user) {
    return next();
  }
  app.use(
    helmet.contentSecurityPolicy({
      directives: {
        "default-src": ["'self'"],
        "script-src": ["'self'", "'unsafe-inline'", "js.stripe.com"],
        "style-src": ["'self'", "'unsafe-inline'", "fonts.googleapis.com"],
        "frame-src": ["'self'", "js.stripe.com"],
        "font-src": ["'self'", "fonts.googleapis.com", "fonts.gstatic.com"],
      },
    })
  );
  User.findById(req.session.user._id)
    .then((user) => {
      if (!user) {
        return next();
      }
      req.user = user;
      next();
    })
    .catch((err) => {
      next(new Error(err));
    });
});
app.use(flash());

const adminRoutes = require("./routes/admin");
const shopRoutes = require("./routes/shop");
const authRoutes = require("./routes/auth");

//using sql
// const sequelize = require('./util/database');

//using mongodb
//const mongoConnect = require('./util/database').mongoConnect;

//using mongoose
const mongoose = require("mongoose");

// const Product = require('./models/product');
// const User = require('./models/user');
// const Cart = require('./models/cart');
// const CartItem = require('./models/cart-item')
// const Order = require('./models/order');
// const OrderItem = require('./models/order-item')

app.use(express.static(path.join(__dirname, "public")));
app.use(express.static(path.join(__dirname, "images")));

app.use("/admin", adminRoutes);
app.use(shopRoutes);
app.use(authRoutes);

app.get("/500", errorController.getError);
app.use(errorController.getPageNotFound);

//using sql

// Product.belongsTo(User, {constraints: true, onDelete: 'CASCADE'});
// User.hasMany(Product)
// User.hasOne(Cart);
// Cart.belongsTo(User);
// Cart.belongsToMany(Product, {through: CartItem});
// Product.belongsToMany(Cart, {through: CartItem})
// Order.belongsTo(User);
// User.hasMany(Order)
// Order.belongsToMany(Product, {through: OrderItem})

// sequelize.sync()
// .then(result => {
//     return User.findByPk(1)
// })
// .then(user => {
//     if(!user) {
//         return User.create({
//             name: 'Sukanya Dutta',
//             email: 'isukanyadutta@gmail.com'
//         })
//     }
//     return user;
// })
// .then (user => {
//     return user.createCart();

// })
// .then (cart => app.listen(3000))
// .catch(err => console.log(err))

//using mongodb

// mongoConnect(() => {
//     app.listen(3000)
// })

//using mongoose
app.use((err, req, res, next) => {
  console.log(err)
  res.status(500).render("500", {
    pageTitle: "Error Page",
    path: "/500",
    isAuthenticated: req.session.isLoggedIn,
  });
});

mongoose
  .connect(MONGODB_URI)
  .then((result) => {
    app.listen(process.env.PORT || 3000);
  })
  .catch((err) => console.log(err));
