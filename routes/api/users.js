const express = require("express");
const router = express.Router();
const gravatar = require("gravatar"); //https://github.com/emerleite/node-gravatar
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const keys = require("../../config/keys");
const passport = require("passport");

//load input validation
const validateRegisterInput = require("../../validation/register");
const validateLoginInput = require("../../validation/login");

//Load User Model
const User = require("../../models/User");

//@route GET api/users/test
//@desc Tests users route
//@access Public
router.get("/test", (req, res) => res.json({ msg: "users works" })); //res.json will send a status 200

//@route POST api/users/register
//@desc Register a user
//@access Public
router.post("/register", (req, res) => {
  const { errors, isValid } = validateRegisterInput(req.body);

  // check validation
  if (!isValid) {
    return res.status(400).json(errors);
  }

  //looks for record that has an email that the user is trying to register with
  User.findOne({ email: req.body.email }).then(user => {
    //means that there is a user with the same email
    if (user) {
      errors.email = "Email already exist";
      return res.status(400).json(errors);
    } else {
      const avatar = gravatar.url(req.body.email, {
        s: "200", //size
        r: "pg", //rating
        d: "mm" //default
      });

      const newUser = new User({
        name: req.body.name,
        email: req.body.email,
        avatar,
        password: req.body.password
      });

      bcrypt.genSalt(10, (err, salt) => {
        //user password will be passed with salt.
        //then invoke a callback function with err and hash will be stored in DB
        bcrypt.hash(newUser.password, salt, (err, hash) => {
          if (err) throw err;
          console.log(err);
          newUser.password = hash;
          newUser
            .save()
            .then(user => res.json(user))
            .catch(err => console.log(err));
        });
      });
    }
  });
});

//@route GET api/users/login
//@desc Login User / Returning JWT token
//@access Public
router.post("/login", (req, res) => {
  const { error, isValid } = validateLoginInput(req.body);

  //check login validation
  const email = req.body.email;
  const password = req.body.password;

  //find the user by email
  User.findOne({ email }).then(user => {
    const { errors, isValid } = validateLoginInput(req.body);

    // check validation
    if (!isValid) {
      return res.status(400).json(errors);
    }
    //check for user
    if (!user) {
      errors.email = "User Not Found";
      return res.status(404).json(errors); //404 not found
    }

    //check password
    bcrypt.compare(password, user.password).then(isMatch => {
      if (isMatch) {
        //if the user passed
        //User Matched

        //sign token
        //sign takes a payload of user info
        //also needs to send a key to expire
        const payload = { id: user.id, name: user.name, avatar: user.avatar }; //create jwt payload

        jwt.sign(
          payload,
          keys.secretOrKey,
          { expiresIn: 3600 },
          (err, token) => {
            //token expires in an hour
            res.json({
              success: true,
              token: "Bearer " + token
            });
          }
        );
      } else {
        errors.password = "Password incorrect";
        return res.status(400).json(errors);
      }
    });
  });
});

//@route GET api/users/current
//@desc Return current suer
//@access Private
router.get(
  "/current",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    res.json({
      id: req.user.id,
      name: req.user.name,
      email: req.user.email
    });
  }
);

module.exports = router;
