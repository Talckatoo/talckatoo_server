import { AnyARecord } from "dns";
import { Request, Response, NextFunction } from "express";
const User = require("../models/user-model");
const catchAsync = require("../../utils/catch-async");
const passport = require("../../utils/passport-config");
const AppError = require("../../utils/custom-error");
const Conversation = require("../models/conversation-model");
const axios = require("axios");
const nodemailer = require("nodemailer");
const crypto = require("crypto");

exports.signUp = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { userName, email, password, language } = req.body;

    if (!userName || !email || !password) {
      throw new AppError(
        "The user is either missing the username, the email, or the password...Please double check these entries",
        400
      );
    }

    const response = await axios.post(
      process.env.NEW_API_URL,
      {
        text: "welcome",
        target_lang: language?.toUpperCase(),
      },
      {
        headers: {
          Authorization: `DeepL-Auth-Key ${process.env.AUTH_KEY}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    const welcome = response.data.translations[0].text;

    const user = await User.create({
      userName,
      email: email.toLowerCase(),
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
    console.log("login");
    if (!email || !password) {
      throw new AppError(
        "Either the email or the password are missing completely from this submission. Please check to make sure and email and a password are included in your submission.",
        400
      );
    }

    const user = await User.findOne({ email }).populate({
      path: "friends",
      select: "userName profileImage language",
    });

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

/**
 * Login with Phone Number
 * @param {string} phoneNumber
 * sends a verification code to the user's phone number
 * we will send the sms using react-native-sms package
 */

export const loginWithPhoneNumber = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { phoneNumber } = req.body;

    if (!phoneNumber) {
      throw new AppError("Please provide a phone number", 400);
    }

    let user = await User.findOne({ phoneNumber });

    // If the user does not exist, create a new user
    if (!user) {
      user = new User({
        phoneNumber,
      });
    }

    const verificationCode = Math.floor(
      100000 + Math.random() * 900000
    ).toString();
    user.verificationCode = verificationCode;
    await user.save();

    res.status(200).json({
      status: "Success",
      message: "Verification code generated successfully",
      verificationCode,
    });
  } catch (error) {
    next(error);
  }
};

exports.forgotPassword = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { email } = req.body;
    if (!email) next(new AppError("please specify your email address", 404));
    const user = await User.findOne({ email });

    if (!user) next(new AppError("no user found with this email address", 404));

    const resetToken = user.createPasswordResetToken();
    console.log(resetToken);
    await user.save({
      validateBeforeSave: false,
    });

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.NODEMAILER_USER,
        pass: process.env.NODEMAILER_PASSWORD,
      },
    });

    transporter.sendMail(
      {
        from: process.env.NODEMAILER_USER, // sender address
        to: email, // list of receivers
        subject: "Talckatoo Reset Password", // Subject line
        text: `Click the following link to reset your password: ${process.env.PUBLIC_URL}/reset-password/${resetToken}`,
      },
      (err: any) => next(new AppError(err.message, 404))
    );

    res.status(200).json({
      status: "success",
      message: "reset url sent to your email",
    });
  }
);

exports.resetPassword = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { token } = req.params;
    const { password } = req.body;
    const decoded = crypto.createHash("sha256").update(token).digest("hex");
    const user = await User.findOne({ passwordResetToken: decoded });

    if (!user) next(new AppError("no user found with this token", 404));

    if (!(user.passwordResetTokenExpires > Date.now()))
      next(
        new AppError(
          "The password reset token has expired please try again",
          404
        )
      );

    user.password = password;
    user.passwordResetTokenExpires = undefined;
    user.passwordResetToken = undefined;
    user.passwordChangedAt = Date.now() - 1000;
    await user.save();

    const jwtToken = user.createJWT();

    res.status(200).json({
      msg: "User successfully authenticated",
      success: "login",
      token: token,
      user,
    });
  }
);
