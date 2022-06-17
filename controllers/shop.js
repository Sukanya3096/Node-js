const Product = require("../models/product");
const Order = require("../models/order");
const User = require("../models/user");
const fs = require("fs");
const path = require("path");
const pdfkit = require("pdfkit");
const env = require("dotenv").config();
const stripe = require("stripe")(process.env.STRIPE_KEY)

const PER_PAGE = 2;

exports.getProducts = (req, res, next) => {
  const page = +req.query.page || 1;
  let totalItems = 0;

  Product.find()
    .countDocuments()
    .then((numProducts) => {
      totalItems = numProducts;
      return Product.find()
        .skip((page - 1) * PER_PAGE)
        .limit(PER_PAGE);
    })
    .then((products) => {
      res.render("shop/product-list", {
        prods: products,
        pageTitle: "Shop",
        path: "/products",
        currentPage: page,
        hasNextPage: PER_PAGE * page < totalItems,
        hasPreviousPage: page > 1,
        nextPage: page + 1,
        previousPage: page - 1,
        lastPage: Math.ceil(totalItems / PER_PAGE),
      });
    })
    .catch((err) => {
      const error = new Error("Fetching products failed!");
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.getIndex = (req, res, next) => {
  const page = +req.query.page || 1;
  let totalItems = 0;

  Product.find()
    .countDocuments()
    .then((numProducts) => {
      totalItems = numProducts;
      return Product.find()
        .skip((page - 1) * PER_PAGE)
        .limit(PER_PAGE);
    })
    .then((products) => {
      res.render("shop/index", {
        prods: products,
        pageTitle: "Shop",
        path: "/",
        currentPage: page,
        hasNextPage: PER_PAGE * page < totalItems,
        hasPreviousPage: page > 1,
        nextPage: page + 1,
        previousPage: page - 1,
        lastPage: Math.ceil(totalItems / PER_PAGE),
      });
    })
    .catch((err) => {
      const error = new Error("Fetching products failed!");
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.getProduct = (req, res, next) => {
  const prodId = req.params.productId;
  Product.findById(prodId)
    .then((product) => {
      res.render("shop/product-detail", {
        product: product,
        pageTitle: "Product Detail: " + product.title,
        path: "/products",
      });
    })
    .catch((err) => {
      const error = new Error("Fetching product failed!");
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.getCart = (req, res, next) => {
  req.user
    .populate("cart.items.productId")
    .then((user) => {
      const products = user.cart.items;
      res.render("shop/cart", {
        path: "/cart",
        pageTitle: "Your Cart",
        products: products,
      });
    })
    .catch((err) => {
      const error = new Error("Fetching cart failed!");
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.postCart = (req, res, next) => {
  const prodId = req.body.productId;
  Product.findById(prodId)
    .then((product) => {
      return req.user.addToCart(product);
    })
    .then((result) => {
      res.redirect("/cart");
    })
    .catch((err) => {
      const error = new Error("adding to cart failed!");
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.postCartDelete = (req, res, next) => {
  const prodId = req.body.productId;
  req.user
    .removeFromCart(prodId)
    .then((result) => {
      res.redirect("/cart");
    })
    .catch((err) => {
      const error = new Error("Deleting cart failed!");
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.postOrder = (req, res, next) => {
  req.user
    .populate("cart.items.productId")
    .then((user) => {
      const products = user.cart.items.map((i) => {
        return { quantity: i.quantity, product: { ...i.productId._doc } };
      });
      const order = new Order({
        user: {
          name: req.session.user.name,
          email: req.session.user.email,
          userId: req.session.user,
        },
        products: products,
      });
      return order.save();
    })
    .then((result) => {
      return req.user.clearCart();
    })
    .then((result) => res.redirect("/orders"))
    .catch((err) => {
      const error = new Error("Creating an order failed!");
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.getOrders = (req, res, next) => {
  Order.find({ "user.userId": req.session.user._id })
    .then((orders) => {
      res.render("shop/orders", {
        pageTitle: "Orders",
        path: "/orders",
        orders: orders,
      });
    })
    .catch((err) => {
      const error = new Error("Fetching orders failed!");
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.getInvoice = (req, res, next) => {
  const orderId = req.params.orderId;
  Order.findById(orderId)
    .then((order) => {
      if (!order) {
        return next(new Error("No order found."));
      }
      if (order.user.userId.toString() !== req.user._id.toString()) {
        return next(new Error("Unauthorized"));
      }

      const invoiceName = "invoice-" + orderId + ".pdf";
      const invoicePath = path.join("data", "invoices", invoiceName);
      const pdfKit = new pdfkit();
      let total = 0;
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        'attachment; filename="' + invoiceName + '"'
      );
      pdfKit.pipe(fs.createWriteStream(invoicePath));
      pdfKit.pipe(res);

      pdfKit.fontSize(26).text("INVOICE", {
        underline: true,
        align: "center",
      });

      pdfKit.text("---------------------------------", {
        align: "center",
      });

      order.products.forEach((prod) => {
        total += prod.quantity * prod.product.price;
        pdfKit
          .fontSize(14)
          .text(
            `${prod.product.title} - ${prod.quantity} x Rs. ${prod.product.price}`,
            {
              align: "center",
            }
          );
      });
      pdfKit.fontSize(26).text("---------------------------------", {
        align: "center",
      });
      pdfKit.fontSize(18).text("Total price: Rs. " + total, {
        align: "center",
      });

      pdfKit.end();
    })
    .catch((err) => {
      next(err);
    });
};

exports.getCheckout = (req, res, next) => {
  let products = 0;
  let total = 0;
  req.user
    .populate("cart.items.productId")
    .then((user) => {
       products = user.cart.items;
      products.forEach((p) => {
        total += p.quantity * p.productId.price;
      });
      return stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        mode: "payment",
        line_items: products.map((p) => {
          return {
            quantity: p.quantity,
            price_data: {
              currency: "inr",
              unit_amount: p.productId.price * 100,
              product_data: {
                name: p.productId.title,
                description: p.productId.description,
              },
            },
          };
        }),
        success_url:
        req.protocol + "://" + req.get("host") + "/checkout/success",
        cancel_url: req.protocol + "://" + req.get("host") + "/checkout/cancel",
      });
    })
    .then((session) => {
      res.render("shop/checkout", {
        path: "/checkout",
        pageTitle: "Check Out",
        products: products,
        total: total,
        sessionId: session.id,
      });
    })
    .catch((err) => {
      const error = new Error("Getting checkout page failed!");
      error.httpStatusCode = 500;
      return next(error);
    });
};
// exports.getInvoice = (req, res, next) => {
//   const orderId = req.params.orderId;
//   Order.findById(orderId)
//     .then(order => {
//       if (!order) {
//         return next(new Error('No order found.'));
//       }
//       if (order.user.userId.toString() !== req.user._id.toString()) {
//         return next(new Error('Unauthorized'));
//       }
//       const invoiceName = 'invoice-' + orderId + '.pdf';
//       const invoicePath = path.join('data', 'invoices', invoiceName);

//       const pdfDoc = new PDFDocument();
//       res.setHeader('Content-Type', 'application/pdf');
//       res.setHeader(
//         'Content-Disposition',
//         'inline; filename="' + invoiceName + '"'
//       );
//       pdfDoc.pipe(fs.createWriteStream(invoicePath));
//       pdfDoc.pipe(res);

//       pdfDoc.fontSize(26).text('Invoice', {
//         underline: true
//       });
//       pdfDoc.text('-----------------------');
//       let totalPrice = 0;
//       order.products.forEach(prod => {
//         totalPrice += prod.quantity * prod.product.price;
//         pdfDoc
//           .fontSize(14)
//           .text(
//             prod.product.title +
//               ' - ' +
//               prod.quantity +
//               ' x ' +
//               '$' +
//               prod.product.price
//           );
//       });
//       pdfDoc.text('---');
//       pdfDoc.fontSize(20).text('Total Price: $' + totalPrice);

//       pdfDoc.end();
//       // fs.readFile(invoicePath, (err, data) => {
//       //   if (err) {
//       //     return next(err);
//       //   }
//       //   res.setHeader('Content-Type', 'application/pdf');
//       //   res.setHeader(
//       //     'Content-Disposition',
//       //     'inline; filename="' + invoiceName + '"'
//       //   );
//       //   res.send(data);
//       // });
//       // const file = fs.createReadStream(invoicePath);

//       // file.pipe(res);
//     })
//     .catch(err => next(err));
// };

//  exports.postCart = (req,res,next) => {
//   const prodId = req.body.productId;
//   Product.findById(prodId)
//   .then(product => {
//     return req.session.user.addToCart(product)
//   })
//   .then(result => {
//     console.log('in cart', result);
//     res.redirect('/cart')
//   })
//   .catch(err => console.log(err))

//  }

//  exports.getCart = (req, res, next) => {
//   req.session.user.populate('cart.items.productId')
//   .then(user => {
//     console.log("in user:",user)
//     res.render('shop/cart', {
//             path: '/cart',
//             pageTitle: 'Your Cart',
//             products: user.cart.items,
//           });
//   })
//   .catch(err => console.log(err))
// };

// exports.postCartDelete = (req,res,next) => {
//   const prodId = req.body.productId;
//   console.log(prodId)
//   req.session.user.deleteCartItems(prodId)
//   .then(result => {
//     console.log(result)
//     res.redirect('/cart')
//   })
//   .catch(err => console.log(err))

// }

// exports.getProducts = (req, res, next) => {

// file system
// const products = Product.fetchAll((products) => {
//   res.render('shop/product-list', {prods: products, pageTitle: 'Shop', path: '/products'});
// });

// database
// Product.fetchAll()
// .then(([rows,fieldData]) => {
//   res.render('shop/product-list', {prods: rows, pageTitle: 'Shop', path: '/products'})
// })
// .catch(err => console.log(err))

// using sql
//   Product.findAll()
//   .then(products => {
//     res.render('shop/product-list', {prods: products, pageTitle: 'Shop', path: '/products'})
//  })
//   .catch(err => console.log(err))

//   Product.fetchAll()
//   .then(products => {
//     res.render('shop/product-list', {prods: products, pageTitle: 'Shop', path: '/products'})
//  })
//   .catch(err => console.log(err))

// }
// exports.getProduct = (req,res,next) => {
//   const prodId = req.params.productId;
// file system
// Product.fetchProduct(prodId, product => {
//   res.render('shop/product-detail', {product: product, pageTitle: 'Product Detail: '+ product.title, path: '/products'})
// })

// database
//   Product.fetchProduct(prodId)
//   .then((product) => {
//     res.render('shop/product-detail', {product: product, pageTitle: 'Product Detail: '+ product.title, path: '/products'})
//   })
//   .catch(err => console.log(err))
// }
// exports.getIndex = (req, res, next) => {
// const products = Product.fetchAll((products) => {
//   res.render('shop/index', {prods: products, pageTitle: 'Shop', path: '/'});
// });

// database
// Product.fetchAll()
// .then(([rows,fieldData]) => {
//   res.render('shop/index', {prods: rows, pageTitle: 'Shop', path: '/'});
// })
// .catch(err => console.log(err))

//   Product.fetchAll()
//          .then(products => {
//           res.render('shop/index', {prods: products, pageTitle: 'Shop', path: '/'});
//         })
//          .catch(err => console.log(err))
// }

// exports.getCart = (req, res, next) => {

// file system
// Cart.getCart(cart => {
//   Product.fetchAll(products => {
//     const cartProducts = [];
//     for (product of products) {
//       const cartProductData = cart.products.find(
//         prod => prod.id === product.id
//       );
//       if (cartProductData) {
//         cartProducts.push({ productData: product, qty: cartProductData.qty });
//       }
//     }
//     res.render('shop/cart', {
//       path: '/cart',
//       pageTitle: 'Your Cart',
//       products: cartProducts
//     });
//   });
// });

// database

//   req.user.getCart()
//   .then(products => {
//     res.render('shop/cart', {
//             path: '/cart',
//             pageTitle: 'Your Cart',
//             products: products
//           });
//   })
//   .catch(err => console.log(err))
// };

// exports.postCart = (req,res,next) => {
//   const prodId = req.body.productId;
//   Product.fetchProduct(prodId)
//   .then(product => {
//     return req.user.addToCart(product)
//   })
//   .then(result => {
//     console.log(result);
//     res.redirect('/cart')
//   })
//   .catch(err => console.log(err))

// let fetchedCart;
// let newQty = 1;
// Product.fetchProduct(prodId, (product) => {
//   console.log(product)
//   Cart.addProduct(prodId, product.price);
// })
// res.redirect('/cart')

// req.user.getCart()
// .then(cart => {
//   fetchedCart = cart;
//   return cart.getProducts({where: {id: prodId}})
// })
// .then(products => {
//   let product;
//   if (products.length > 0) {
//     product = products[0]
//   }
//   if (product) {
//     const oldQty = product.cartItem.quantity;
//     newQty = oldQty + 1;
//     return product;
//   }
//   return Product.findByPk(prodId)

// })
// .then(product => {
//   return fetchedCart.addProduct(product, {through: {quantity: newQty}})
// })
// .then(result => res.redirect('/cart'))
// .catch(err => console.log(err))
// }

// exports.postCartDelete = (req,res,next) => {
//   const prodId = req.body.productId;
//   // Product.fetchProduct(prodId, product => {
//   //   Cart.deleteItem(prodId, product.price);
//   //   res.redirect('/cart')
//   // })

//   // req.user.getCart()
//   // .then(cart => {
//   //   return cart.getProducts({where: {id: prodId}})
//   // })
//   // .then(products => {
//   //   const product = products[0]
//   //   return product.cartItem.destroy()
//   // })
//   // .then(result => {
//   //   res.redirect('/cart')
//   // })
//   // .catch(err => console.log(err))

//   req.user.deleteCartItems(prodId)
//   .then(result => {
//     res.redirect('/cart')
//   })
//   .catch(err => console.log(err))

// }
// exports.postOrder = (req,res,next) => {
//   req.user.addOrder()
//   .then(result => {
//     res.redirect('/orders')
//   })
//   .catch(err => console.log(err))
//   //let fetchedCart;
//   // req.user.getCart()
//   // .then(cart => {
//   //   fetchedCart = cart;
//   //   return cart.getProducts()
//   // })
//   // .then(product => {
//   //   return req.user.createOrder()
//   //   .then(order => {
//   //     order.addProducts(product.map(prod => {
//   //       prod.orderItem = {quantity: prod.cartItem.quantity}
//   //       return prod;
//   //     }))
//   //   }).catch(err => {console.log(err)})
//   // })
//   // .then(result => {
//   //   return fetchedCart.setProducts(null)
//   // })
//   // .then(result => {
//   //   res.redirect('/orders')
//   // })
//   // .catch(err => console.log(err));
// }

// exports.getOrders = (req,res,next) => {
//   // req.user.getOrders({include: ['products']})
//   // .then(orders => {
//   //   res.render('shop/orders', {pageTitle: 'Orders', path: '/orders', orders: orders})
//   // })
//   // .catch(err => console.log(err))

//   req.user.getOrders()
//   .then(orders => {
//     res.render('shop/orders', {pageTitle: 'Orders', path: '/orders', orders: orders})
//   })
//   .catch(err => console.log(err))
// }
