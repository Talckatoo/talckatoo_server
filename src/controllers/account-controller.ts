import { Request, Response, NextFunction } from "express";
const User = require("../models/user-model");
const catchAsync = require("../../utils/catch-async");
const passport = require("../../utils/passport-config");
const AppError = require("../../utils/custom-error");
const Conversation = require("../models/conversation-model");
const axios = require("axios");

exports.signUp = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { userName, email, password, language } = req.body;

    if (!userName || !email || !password) {
      throw new AppError(
        "The user is either missing the username, the email, or the password...Please double check these entries",
        400
      );
    }

    const options = {
      method: "POST",
      url: process.env.TRANSLATE_URL,
      headers: {
        "content-type": "application/json",
        "X-RapidAPI-Key": process.env.TRANSLATE_API_KEY,
        "X-RapidAPI-Host": process.env.API_HOST,
      },
      data: {
        text: "welcome",
        target: language,
      },
    };
    const response = await axios.request(options);
    const welcome = response.data[0].result.text;

    const user = await User.create({
      userName,
      email,
      password,
      language,
      welcome,
    });
    const userId = user._id;

    const aiId = process.env.AI_ASSISTANT_ID;

    const conversation = await Conversation.create({
      users: [userId, aiId],
    });

    await User.findOneAndUpdate(
      { _id: userId },
      { $push: { conversations: conversation.id } }
    );

    await User.findOneAndUpdate(
      { _id: aiId },
      { $push: { conversations: conversation.id } }
    );

    const token = user.createJWT();

    res.status(201).json({ message: "User successfully created", token, user });
  }
);

exports.logIn = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { email, password } = req.body;

    if (!email || !password) {
      throw new AppError(
        "Either the email or the password are missing completely from this submission. Please check to make sure and email and a password are included in your submission.",
        400
      );
    }

    const user = await User.findOne({ email });

    if (!user) {
      throw new AppError(" The user for this email could not be found.", 400);
    }

    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      throw new AppError("The password or username is wrong", 400);
    }

    const token = user.createJWT();

    res.status(200).json({
      msg: "User successfully authenticated",
      success: "login",
      token,
      user,
    });
  }
);

// exports.loginWithGoogle = catchAsync(
//   async (req: Request, res: Response, next: NextFunction) => {
//     return passport.authenticate("google", {
//       scope: ["profile", "email"],
//       session: true,
//     })(req, res, next);
//   }
// );

// exports.redirectHome = catchAsync(
//   async (req: Request, res: Response, next: NextFunction) => {
//     return passport.authenticate("google", {
//       scope: ["profile", "email"],
//       session: true,
//       failureRedirect: "/api/v1/users/auth/google",
//     })(req, res, next);
//   }
// );

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
