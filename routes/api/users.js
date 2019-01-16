const express = require("express");
const router = express.Router();
const gravatar = require("gravatar"); //https://github.com/emerleite/node-gravatar
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const keys = require("../../config/keys");
const passport = require("passport");

//Load User Model
const User = require("../../models/User");

//@route GET api/users/test
//@desc Tests users route
//@access Public
router.get("/test", (req, res) => res.json({ msg: "users works" })); //res.json will send a status 200

//@route GET api/users/register
//@desc Register a user
//@access Public
router.post("/register", (req, res) => {
  User.findOne({ email: req.body.email }) //looks for record that has an email that the user is trying to register with
    .then(user => {
      //means that there is a user with the same email
      if (user) {
        return res.status(400).json({ email: "Email already exist" });
      } else {
        const avatar = gravatar.url(req.body.email, {
          s: "200", //size
          r: "r", //rating
          m: "mm" //default
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
  const email = req.body.email;
  const password = req.body.password;

  //find the user by email
  User.findOne({ email }).then(user => {
    //check for user
    if (!user) {
      return res.status(404).json({ email: "User not found" }); //404 not found
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
        return res.status(400).json({ password: "Password incorrect" });
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
