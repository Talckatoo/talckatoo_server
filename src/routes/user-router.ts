const express = require("express");
const router = express.Router();

const {
  signUp,
  logIn,
  logOut,
  loginWithGoogle,
  redirectHome,
} = require("../controllers/auth-user-controller");

router.route("/sign-up").post(signUp);
router.route("/log-in").post(logIn);
router.route("/auth/google").get(loginWithGoogle);
router.route("/auth/google/callback").get(redirectHome);
router.route("/logout").post(logOut);

export {};
module.exports = router;
