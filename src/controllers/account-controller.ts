import { Request, Response, NextFunction } from "express";
import getTranslation from "../../utils/translator-api";
import generateVerificationCode from "../../utils/regenerateVerificationCode";
const User = require("../models/user-model");
const catchAsync = require("../../utils/catch-async");
const passport = require("../../utils/passport-config");
const AppError = require("../../utils/custom-error");
const Conversation = require("../models/conversation-model");
const axios = require("axios");
const nodemailer = require("nodemailer");
const crypto = require("crypto");
const mailConstructor = require("../../utils/mail-constructor");
const NewsletterEmail = require("../models/newsLetterEmail-model");
const handlebars = require("handlebars");
const fs = require("fs");
const CryptoJS = require('crypto-js');

// const templatePath = path.join(__dirname,'../templates/Verification.hbs');
// const templatePathRest = path.join(__dirname,'../templates/Password.hbs');
// const sourceRest = fs.readFileSync(templatePathRest, 'utf8');
// const source = fs.readFileSync(templatePath, 'utf8');
// const templateRest = handlebars.compile(sourceRest);
// const template = handlebars.compile(source);

const path = require("path");

// Define the directory containing your templates
const templatesDir = path.resolve(process.cwd(), "dist/src/templates");

// Define the filenames of your templates
const verificationFilename = "verification_email.hbs";
const passwordFilename = "password_reset.hbs";

// Resolve the full paths to the template files
const verificationPath = path.resolve(templatesDir, verificationFilename);
const passwordPath = path.resolve(templatesDir, passwordFilename);

// Read the contents of the template files
const verificationTemplate = fs.readFileSync(verificationPath, "utf8");
const passwordTemplate = fs.readFileSync(passwordPath, "utf8");

// Compile the Handlebars templates
const compiledVerificationTemplate = handlebars.compile(verificationTemplate);
const compiledPasswordTemplate = handlebars.compile(passwordTemplate);

exports.signUp = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { userName, email, password, language } = req.body;

    // email to lower case 
    const emailLower = email.toLowerCase();


    // check if the email exists
    const userEmail = await User.findOne({ email: emailLower, deleted: false });

    if (userEmail) {
      throw new AppError("The email is already in use", 400);
    }

    // Check if the email exists and is soft deleted
    const softDeletedUser = await User.findOne({ email: emailLower, delete: true });

    if (softDeletedUser) {
      throw new AppError("The email has already been used to create an account before! please use another email", 400);
    }

    if (!userName || !email || !password) {
      throw new AppError(
        "The user is either missing the username, the email, or the password...Please double check these entries",
        400
      );
    }

    const response: any = await getTranslation(
      language,
      "welcome",
      process.env.AZURE_TRANSLATOR_KEY,
      process.env.TRANSLATOR_ENDPOINT
    );
    const welcome = response && response[0]?.text;

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


export const logIn = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { email, password } = req.body;

    if (!email || !password) {
      return next(new AppError(
        "Please ensure both email and password are included in your submission.",
        400
      ));
    }

    // Convert email to lowercase
    const emailLower = email.toLowerCase();

    // Attempt to find a user by email
    const user = await User.findOne({ email: emailLower }).populate({
      path: "friends",
      select: "userName profileImage language",
    });

    // If no user is found
    if (!user) {
      return next(new AppError("The user for this email could not be found.", 400));
    }

    // Check if the user has the 'deleted' property
    if (user.deleted === undefined) {
      // Add 'deleted' property to the user document
      user.deleted = false;
      await user.save(); // Save the updated user document
    }

    // If the user is marked as deleted
    if (user.deleted) {
      return next(new AppError("This account has been deleted.", 400));
    }

    // Check if the provided password matches the user's password
    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      return next(new AppError("The provided credentials are incorrect.", 400));
    }

    // Generate JWT token
    const token = user.createJWT();

    // Send success response
    res.status(200).json({
      message: "User successfully authenticated",
      token,
      user,
    });
  }
);

// account-controller.js
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

    // Compile the HTML template with the verification code
    const html = compiledPasswordTemplate({
      public_url: process.env.PUBLIC_URL,
      resetToken,
    });

    transporter.sendMail(
      {
        from: process.env.NODEMAILER_USER, // sender address
        to: email, // list of receivers
        subject: "Talckatoo Reset Password", // Subject line
        html: html, // plain text body
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

// login with google account
exports.loginWithGoogle = (req: Request, res: Response, next: NextFunction) => {
  passport.authenticate("google", {
    scope: ["profile", "email"],
  })(req, res, next);
};

// Callback after Google has authenticated the user
exports.googleCallback = (req: Request, res: Response, next: NextFunction) => {
  // generate a token on succes
  passport.authenticate("google", { session: false }, (err: any, user: any) => {
    if (err) {
      return next(err);
    }
    if (!user) {
      return next(new AppError("Authentication failed", 400));
    }
    const token = user.createJWT();
    // code user data
    const userData = {
      _id: user._id,
      userName: user.userName,
      email: user.email,
      profileImage: user.profileImage,
      language: user.language,
      friends: user.friends,
      conversations: user.conversations,
    };

    // redirect to the client with the token
    res.redirect(
      `${process.env.CLIENT_URL}/?token=${token}&userId=${userData._id}`
    );
  })(req, res, next);
};

exports.emailVerification = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email } = req.body;
    if (!email) throw new Error("Please provide an email address");

    const userEmail = await User.findOne({ email });

    if (userEmail) {
      throw new AppError("The email is already in use", 400);
    }

    // Generate verification code
    const verificationCode = generateVerificationCode();
    console.log(verificationCode)
    const encryptVerificationCodeFunc = (verificationCode: string, key: any, iv: any) => {
      try {
        const encrypted = CryptoJS.AES.encrypt(verificationCode, key, { iv: iv });
        return encrypted.toString();
      } catch (error) {
        // Handle encryption errors
        console.error("Encryption error:", error);
        throw new Error("Encryption failed");
      }
    }

    // encrypt verification code
    const secretKey = process.env.ENCRYPTION_KEY; // Keep this secret!
    const iv = process.env.ENCRYPTION_IV; // iv signature
    const encryptedVerificationCode = encryptVerificationCodeFunc(verificationCode, secretKey, iv);
    
    // Compile the HTML template with the verification code
    const html = compiledVerificationTemplate({ verificationCode });

    // Send verification email
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.NODEMAILER_USER,
        pass: process.env.NODEMAILER_PASSWORD,
      },
    });

    await transporter.sendMail({
      from: process.env.NODEMAILER_USER,
      to: email,
      subject: "Email Verification",
      html: html, // Use the compiled HTML template
    });

    res.status(200).json({
      status: "success",
      message: "Verification code sent to your email",
      verificationCode: encryptedVerificationCode,
    });
  } catch (error: any) {
    console.error(error);
    res.status(400).json({ message: error.message });
  }
};

exports.newsLetter = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email } = req.body;
    if (!email) throw new Error("Please provide an email address");

    // Check if the email already exists in the newsletter email collection
    const existingEmail = await NewsletterEmail.findOne({ email });

    if (existingEmail) {
      throw new Error("The email is already signed up for the newsletter");
    }

    // Save the new email address to your newsletter email collection
    await NewsletterEmail.create({ email });

    // Send verification email
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.NODEMAILER_USER,
        pass: process.env.NODEMAILER_PASSWORD,
      },
    });

    await transporter.sendMail({
      from: process.env.NODEMAILER_USER,
      to: email,
      subject: "Talckatoo Newsletter Subscription",
      text: `Thank you for signing up to our newsletter!`,
    });

    res.status(200).json({
      status: "success",
      message: "Newsletter sent to your email",
    });
  } catch (error: any) {
    console.error(error);
    res.status(400).json({ message: error.message });
  }
};

// Delete account contorller

exports.deleteAccount = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {

    // Assuming req.user is set after successful authentication
    // if(!req.user) {
    //   throw new AppError("Please login to delete your account", 400);
    // }

    const { email } = req.body;

    if (!email) {
      throw new AppError("Please provide an email address", 400);
    } else {

      const user = await User.findOneAndUpdate({ email }, { $set: { deleted: true } });

      if (!user) {
        throw new AppError("A user with this Emai does not exist", 400);
      } else {
        res.status(200).json({
          status: "success",
          message: "User deleted successfully",
        });
      }
    }
  }
);

