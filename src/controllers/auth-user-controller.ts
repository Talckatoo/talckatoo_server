import { Request, Response, NextFunction } from "express";
const User = require("../models/user-model");
const catchAsync = require("../../utils/catch-async");
const passport = require("../../utils/passport-config");
const AppError = require("../../utils/custom-error");

exports.signUp = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { userName, email, password } = req.body;

    if (!userName || !email || !password) {
      throw new AppError("Invalid Credentials", 400);
    }
    const user = await User.create({ userName, email, password });
    res.status(201).json({ message: "User successfully created" });
  }
);

exports.logIn = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { userName, password } = req.body;

    if (!userName || !password) {
      throw new AppError("Invalid Credentials", 400);
    }

    const user = await User.findOne({ userName });

    if (!user) {
      throw new AppError("Invalid username or password", 400);
    }

    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      throw new AppError("Invalid email or password", 400);
    }

    const accessToken = user.createJWT();

    res
      .status(200)
      .json({ message: "User successfully authenticated", accessToken });
  }
);

exports.loginWithGoogle = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    return passport.authenticate("google", { scope: ["profile", "email"] })(
      req,
      res,
      next
    );
  }
);

exports.redirectHome = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    return passport.authenticate("google", {
      scope: ["profile", "email"],
      failureRedirect: "/api/v1/users/auth/google",
    })(req, res, next);
  }
);

exports.logOut = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    if (req.user) {
      req.logout((err) => {
        if (err) {
          throw new AppError("Something went wrong, please try again", 500);
        }
        return res
          .status(200)
          .json({ message: "User logged out successfully" });
      });
    } else {
      res.status(400).json({ message: "Log out failed" });
    }
  }
);
