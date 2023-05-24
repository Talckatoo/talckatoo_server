const express = require("express");
const router = express.Router();

const { signUp, logIn } = require("../controllers/auth-user-controller");

router.route("/sign-up").post(signUp)
router.route("/log-in").post(logIn);

export {};
module.exports = router;
