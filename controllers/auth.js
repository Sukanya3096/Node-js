const User = require("../models/user");
const bcrypt = require("bcryptjs");
const nodemailer = require("nodemailer");
const env = require("dotenv").config();
const crypto = require("crypto");
const { validationResult } = require("express-validator");

var transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.USER_ID,
    pass: process.env.PASSWORD,
  },
});

exports.getLogin = (req, res, next) => {
  let message = req.flash("error");
  if (message.length > 0) {
    message = message[0];
  } else {
    message = null;
  }

  res.render("auth/login", {
    pageTitle: "Login",
    path: "/login",
    isAuthenticated: false,
    errorMessage: message,
    oldInput: {
        email: '',
        password: '',
      },
      validationErrors: []
  });
};

exports.postLogin = (req, res, next) => {
  const email = req.body.email;
  const password = req.body.password;
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(422).render("auth/login", {
      path: "/login",
      pageTitle: "Login",
      errorMessage: errors.array()[0].msg,
      oldInput: {
        email: email,
        password: password,
      },
      validationErrors: errors.array()
    });
  }
  User.findOne({ email: email })
    .then((user) => {
      if (!user) {
        return Promise.resolve(req.flash("error", "Invalid Email"))
          .then((result) => {
            return req.session.save((err) => {
              return res.redirect("/signup");
            });
          })
          .catch((err) => {
            console.log(err);
          });
      }
      bcrypt
        .compare(password, user.password)
        .then((doMatch) => {
          if (doMatch) {
            req.session.isLoggedIn = true;
            req.session.user = user;
            return req.session.save((err) => {
              res.redirect("/");
            });
          }
          return Promise.resolve(req.flash("error", "Invalid Password"))
            .then((result) => {
              return req.session.save((err) => {
                res.redirect("/login");
              });
            })
            .catch((err) => {
              console.log(err);
            });
        })
        .catch((err) => {
          res.redirect("/login");
        });
    })
    .catch((err) => {
        const error =  new Error('Creating a product failed!');
        error.httpStatusCode = 500;
        return next(error);
    });
};

exports.postLogout = (req, res, next) => {
  req.session.destroy((err) => {
    res.redirect("/");
  });
};
exports.getSignup = (req, res, next) => {
  let message = req.flash("error");
  if (message.length > 0) {
    message = message[0];
  } else {
    message = null;
  }

  res.render("auth/signup", {
    path: "/signup",
    pageTitle: "Signup",
    isAuthenticated: false,
    errorMessage: message,
    oldInput: {
        email: '',
        password: '',
        confirmPassword: '',
        username: '',
      },
      validationErrors: []
  });
};
exports.postSignup = (req, res, next) => {
  const name = req.body.username;
  const email = req.body.email;
  const password = req.body.password;
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(422).render("auth/signup", {
      path: "/signup",
      pageTitle: "Signup",
      isAuthenticated: false,
      errorMessage: errors.array()[0].msg,
      oldInput: {
        email: email,
        password: password,
        confirmPassword: req.body.confirmPassword,
        username: req.body.username,
      },
      validationErrors: errors.array()
    });
  }
  bcrypt
    .hash(password, 12)
    .then((hashedPassword) => {
      const user = new User({
        name: name,
        email: email,
        password: hashedPassword,
        cart: { items: [] },
      });
      return user.save();
    })
    .then((result) => {
      res.redirect("/login");

      return transporter.sendMail(
        {
          from: process.env.USER_ID,
          to: email,
          subject: "USER SIGN UP",
          html: "<h1>Welcome!</h1><p>You have successfully signed up!</p>",
        },
        function (error, info) {
          if (error) {
            console.log(error);
          } else {
            console.log("Email sent: " + info.response);
          }
        }
      );
    })
    .catch((err) => {
        const error =  new Error('Creating a product failed!');
        error.httpStatusCode = 500;
        return next(error);
    });
};

exports.getReset = (req, res, next) => {
  let message = req.flash("error");
  if (message.length > 0) {
    message = message[0];
  } else {
    message = null;
  }

  res.render("auth/reset", {
    pageTitle: "Reset",
    path: "/reset",
    errorMessage: message,
  });
};

exports.postReset = (req, res, next) => {
  crypto.randomBytes(12, (err, buffer) => {
    if (err) {
      return res.redirect("/reset");
    }
    const token = buffer.toString("hex");
    User.findOne({ email: req.body.email })
      .then((user) => {
        if (!user) {
          return Promise.resolve(
            req.flash("error", "No account with that email exists!")
          )
            .then((result) => {
              return req.session.save((err) => {
                res.redirect("/reset");
              });
            })
            .catch((err) => {
              console.log(err);
            });
        }
        user.resetToken = token;
        user.resetTokenExpiry = Date.now() + 3600000;
        return user
          .save()
          .then((result) => {
            res.redirect("/login");
            return transporter.sendMail(
              {
                from: process.env.USER_ID,
                to: req.body.email,
                subject: "PASSWORD RESET",
                html: `<p>You requested a password reset!</p>
                    <p>click this <a href="http://localhost:3000/reset/${token}">Link</a> to set a new password</p>`,
              },
              function (error, info) {
                if (error) {
                  console.log(error);
                } else {
                  console.log("Email sent: " + info.response);
                }
              }
            );
          })
          .catch((err) => {
            const error =  new Error('Creating a product failed!');
            error.httpStatusCode = 500;
            return next(error);
        });
      })
      .catch((err) => {
        const error =  new Error('Creating a product failed!');
        error.httpStatusCode = 500;
        return next(error);
    });
  });
};

exports.getNewPassword = (req, res, next) => {
  const token = req.params.token;
  User.findOne({ resetToken: token, resetTokenExpiry: { $gt: Date.now() } })
    .then((user) => {
      if (user) {
        let message = req.flash("error");
        if (message.length > 0) {
          message = message[0];
        } else {
          message = null;
        }

        res.render("auth/new-password", {
          pageTitle: "New Password",
          path: "/new-password",
          errorMessage: message,
          userId: user._id.toString(),
          passwordToken: token,
        });
      } else {
        res.redirect("/login");
      }
    })
    .catch((err) => {
        const error =  new Error('Creating a product failed!');
        error.httpStatusCode = 500;
        return next(error);
    });
};

exports.postNewPassword = (req, res, next) => {
  const newPassword = req.body.password;
  const userId = req.body.userId;
  const passwordToken = req.body.passwordToken;
  let resetUser;

  User.findOne({
    resetToken: passwordToken,
    resetTokenExpiry: { $gt: Date.now() },
    _id: userId,
  })
    .then((user) => {
      resetUser = user;
      return bcrypt.hash(newPassword, 12);
    })
    .then((hashedPassword) => {
      resetUser.password = hashedPassword;
      resetUser.resetToken = undefined;
      resetUser.resetTokenExpiry = undefined;
      return resetUser.save();
    })
    .then((result) => {
      res.redirect("/login");
      transporter.sendMail(
        {
          from: process.env.USER_ID,
          to: resetUser.email,
          subject: "PASSWORD RESET SUCCESSFUL",
          html: `<p>You have successfully reset the password</p>
            <p>click this <a href="http://localhost:3000/login">Link</a> to login</p>`,
        },
        function (error, info) {
          if (error) {
            console.log(error);
          } else {
            console.log("Email sent: " + info.response);
          }
        }
      );
    })
    .catch((err) => {
        const error =  new Error('Creating a product failed!');
        error.httpStatusCode = 500;
        return next(error);
    });
};
