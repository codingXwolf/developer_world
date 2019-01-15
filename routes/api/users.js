const express = require("express");
const router = express.Router();

//@route GET api/users/test
//@desc Tests users route
//@access Public
router.get("/test", (req, res) => res.json({ msg: "users works" })); //res.json will send a status 200

module.exports = router;
