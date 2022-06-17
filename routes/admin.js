// const express = require("express");
// const path = require("path");

// const pathDir = require('../util/path');

// const router = express.Router();

// const products = [];

// router.get('/add-product',(req,res,next) => {
//    //res.sendFile(path.join(pathDir,'views','add-product.html'))
//    res.render('add-product', {pageTitle: 'Add Product'})

// })
// router.post('/add-product',(req,res,next) => {
//     products.push({title: req.body.title})
//     res.redirect('/')
// })

// exports.routes = router;
// exports.products = products;

const path = require("path");

const express = require("express");

const adminController = require("../controllers/admin");

const router = express.Router();

const isAuth = require("../middleware/is-auth");
const { check, body } = require("express-validator");

// /admin/add-product => GET
router.get("/add-product", isAuth, adminController.getAddProduct);
router.get("/product-list", isAuth, adminController.getProductList);

// /admin/add-product => POST
router.post(
  "/add-product",
  isAuth,
  [
    body("title", "Please enter valid title.")
      .isString()
      .isLength({ min: 3 })
      .trim(),
    body("price").isNumeric().withMessage("Please enter valid price."),
    body("description", "Please enter valid description.")
      .isLength({ min: 5, max: 400 })
      .trim(),
  ],
  adminController.postAddProducts
);

router.get("/edit-product/:productId", isAuth, adminController.getEditProduct);

router.post(
  "/edit-product",
  [
    body("title", "Please enter valid title.")
      .isString()
      .isLength({ min: 3 })
      .trim(),
    body("price").isNumeric().withMessage("Please enter valid price."),
    body("description", "Please enter valid description.")
      .isLength({ min: 5, max: 400 })
      .trim(),
  ],
  isAuth,
  adminController.postEditProducts
);

router.delete(
  "/delete-product/:productId",
  isAuth,
  adminController.deleteProducts
);

// exports.routes = router;
// exports.products = products;
module.exports = router;
