const Product = require("../models/product");
const path = require("../util/path");
const { validationResult } = require("express-validator");
const fileHelper = require("../util/file");

exports.postAddProducts = (req, res, next) => {
  const title = req.body.title;
  const image = req.file;
  const description = req.body.description;
  const price = req.body.price;
  if (!image) {
    return res.status(422).render("admin/edit-product", {
      pageTitle: "Add Product",
      path: "/admin/add-product",
      editing: false,
      hasError: true,
      errorMessage: "Attached file is not a valid image.",
      validationErrors: [],
      product: {
        title: title,
        description: description,
        price: price,
      },
    });
  }
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(422).render("admin/edit-product", {
      pageTitle: "Add Product",
      path: "/admin/add-product",
      editing: false,
      hasError: true,
      errorMessage: errors.array()[0].msg,
      validationErrors: errors.array(),
      product: {
        title: title,
        description: description,
        price: price,
      },
    });
  }
  const imageUrl = image.filename;
  const product = new Product({
    title: title,
    price: price,
    imageUrl: imageUrl,
    description: description,
    userId: req.session.user._id,
  });
  product
    .save()
    .then((result) => {
      res.redirect("/admin/product-list");
    })
    .catch((err) => {
      const error = new Error("Creating a product failed!");
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.getEditProduct = (req, res, next) => {
  const editMode = req.query.edit;
  if (!editMode) {
    return res.redirect("/");
  }
  const prodId = req.params.productId;

  Product.findById(prodId)
    .then((product) => {
      if (!product) {
        return res.redirect("/");
      }
      res.render("admin/edit-product", {
        pageTitle: "Edit Product",
        path: "/admin/edit-product",
        editing: editMode,
        product: product,
        hasError: false,
        errorMessage: null,
        validationErrors: [],
      });
    })
    .catch((err) => {
      const error = new Error("Creating a product failed!");
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.getProductList = (req, res, next) => {
  Product.find({ userId: req.user._id })
    .then((products) => {
      res.render("admin/product-list", {
        prods: products,
        pageTitle: "Admin Products",
        path: "admin/products",
      });
    })
    .catch((err) => {
      const error = new Error("Creating a product failed!");
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.postEditProducts = (req, res, next) => {
  const prodId = req.body.productId;
  const title = req.body.title;
  const imageUrl = req.body.imageUrl;
  const image = req.file;
  const description = req.body.description;
  const price = req.body.price;
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(422).render("admin/edit-product", {
      pageTitle: "Edit Product",
      path: "/admin/edit-product",
      editing: true,
      hasError: true,
      errorMessage: errors.array()[0].msg,
      validationErrors: errors.array(),
      product: {
        title: title,
        description: description,
        price: price,
        _id: prodId,
      },
    });
  }

  Product.findById(prodId)
    .then((product) => {
      if (product.userId.toString() !== req.user._id.toString()) {
        return res.redirect("/");
      }
      product.title = title;
      if (image) {
        fileHelper.deleteFile(product.imageUrl);
        product.imageUrl = image.filename;
      }
      product.description = description;
      product.price = price;
      return product
        .save()
        .then((result) => {
          res.redirect("/admin/product-list");
        })
        .catch((err) => {
          const error = new Error("Creating a product failed!");
          error.httpStatusCode = 500;
          return next(error);
        });
    })
    .catch((err) => {
      const error = new Error("Creating a product failed!");
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.deleteProducts = (req, res, next) => {
  const prodId = req.params.productId;
  Product.findById(prodId)
    .then((product) => {
      if (!product) {
        return next(new Error("Product not found."));
      }
      fileHelper.deleteFile(product.imageUrl);
      return Product.deleteOne({ _id: prodId, userId: req.user._id });
    })
    .then((result) => {
      console.log("product removed");
      res.status(200).json({ message: "Deleted Product" });
    })
    .catch((err) => {
      res.status(500).json({ message: "Failed to delete product" });
      return next(error);
    });
};

exports.getAddProduct = (req, res, next) => {
  if (!req.session.isLoggedIn) {
    return res.redirect("/login");
  }
  res.render("admin/edit-product", {
    pageTitle: "Add Product",
    path: "/admin/add-product",
    editing: false,
    hasError: false,
    errorMessage: null,
    validationErrors: [],
  });
};

// exports.postAddProducts = (req, res, next) => {
//     const title = req.body.title;
//     const imageUrl = req.body.imageUrl;
//     const description = req.body.description;
//     const price = req.body.price;
//     const product = new Product(title,price,imageUrl, description,null,req.user._id);
//     product.save()
//     .then(result => {
//         'Created Product';
//         console.log(result)
//         res.redirect('/admin/product-list')
//     })
//     .catch(err => console.log(err))
// .then(() => res.redirect('/'))
// .catch(err => console.log(err))
// req.user.createProduct({
//     title: title,
//     price: price,
//     imageUrl: imageUrl,
//     description: description
// }).then(result => {
//         'Created Product';
//         res.redirect('/admin/product-list')
// })
//       .catch(err => console.log(err))

// }

// exports.postEditProducts = (req,res,next) => {
//     const prodId = req.body.productId;
//     const title = req.body.title;
//     const imageUrl = req.body.imageUrl;
//     const description = req.body.description;
//     const price = req.body.price;
//     const product = new Product(title,price, imageUrl,description,prodId)

// product.save()
// .then(result => {
//     console.log('updated product');
//     res.redirect('/admin/product-list')
// })
// .catch(err => console.log(err))

// Product.fetchProduct(prodId)
//         .then(productData => {
//             // product.title = title;
//             // product.imageUrl = imageUrl;
//             // product.description = description;
//             // product.price = price;
//             // return product.save();

//         })
// .then(result => {
//     console.log('updated product');
//     res.redirect('/admin/product-list')
// })
// .catch(err => console.log(err))

//}
//   exports.getEditProduct = (req, res, next) => {
//       const editMode = req.query.edit;
//       if (!editMode) {
//           return res.redirect('/')
//       }
//       const prodId = req.params.productId;
//file system
//       Product.fetchProduct(prodId, (product) => {
//           if (!product) {
//               return res.redirect('/')
//           }
//         res.render('admin/edit-product', { pageTitle: 'Edit Product', path: '/admin/edit-product', editing: editMode, product: product })
//       })

//database
//   Product.findByPk(+prodId).then(product => {
// if (!product) {
//       return res.redirect('/')
//               }
//     res.render('admin/edit-product', { pageTitle: 'Edit Product', path: '/admin/edit-product', editing: editMode, product: product })
//   }).catch(err => console.log(err))

//mongodb

//     Product.fetchProduct(prodId)
//     .then(product => {
//         if (!product) {
//             return res.redirect('/')
//                     }
//           res.render('admin/edit-product', { pageTitle: 'Edit Product', path: '/admin/edit-product', editing: editMode, product: product })
//     })
//     .catch(err => console.log(err))
//    };

//   exports.getProductList = (req, res, next) => {
//     // req.user.getProducts().then((products) => {
//     //     res.render('admin/product-list', {prods: products, pageTitle: 'Admin Products', path: 'admin/products'});
//     //   }).catch(err => console.log(err));

//     Product.fetchAll()
//     .then(products => {
//         res.render('admin/product-list', {prods: products, pageTitle: 'Admin Products', path: 'admin/products'});
//     })
//     .catch(err => console.log(err))

// }

// exports.deleteProducts = (req,res,next) => {
//     const prodId = req.body.productId;
//     // Product.deleteProduct(prodId);
//     // Product.destroy({where: {id: +prodId}})
//     //         .then(result => {
//     //             console.log('product removed');
//     //             res.redirect('/admin/product-list')
//     //         })
//     //         .catch(err => console.log(err))

//     Product.deleteProduct(prodId, req.user.id)
//     .then(result => {
//        console.log('product removed');
//         res.redirect('/admin/product-list')
//                })
//     .catch(err => console.log(err))
// }
