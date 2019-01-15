const express = require("express");
const router = express.Router();

//@route GET api/posts/test
//@desc Tests post route
//@access Public
router.get("/test", (req, res) => res.json({ msg: "posts works" })); //res.json will send a status 200

module.exports = router;
