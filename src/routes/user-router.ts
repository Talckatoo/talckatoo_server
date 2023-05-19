const express = require("express");
const router = express.Router();

const { signUp } = require("../controllers/auth-user-controller");

router.route("/sign-up").post(signUp);

export {};
module.exports = router;
