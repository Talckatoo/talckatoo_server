const express = require("express");
const router = express.Router();
import { Request, Response, NextFunction } from "express";

const {
  signUp,
  logIn,
  logOut,
  //loginWithGoogle,
  //redirectHome,
} = require("../controllers/auth-controller");

router.route("/sign-up").post(signUp);
router.route("/log-in").post(logIn);
// router.route("google").get(loginWithGoogle);
// router
//   .route("/google/callback")
//   .get(redirectHome, (req: Request, res: Response) => {
//     console.log("fire");
//     res.redirect("/api/v1/");
//   });
router.route("/logout").post(logOut);

export {};
module.exports = router;
