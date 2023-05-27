const express = require("express");
const router = express.Router();
import { Request, Response, NextFunction } from "express";

const {
  signUp,
  logIn,
  logOut,
  //loginWithGoogle,
  //redirectHome,
} = require("../controllers/auth-user-controller");

router.route("/sign-up").post(signUp);
router.route("/log-in").post(logIn);
// router.route("/auth/google").get(loginWithGoogle);
// router
//   .route("/auth/google/callback")
//   .get(redirectHome, (req: Request, res: Response) => {
//     console.log("fire");
//     res.redirect("/api/v1/users/home-page");
//   });
router.route("/logout").post(logOut);

export {};
module.exports = router;
