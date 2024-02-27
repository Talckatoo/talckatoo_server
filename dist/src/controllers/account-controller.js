"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.loginWithPhoneNumber = void 0;
const translator_api_1 = __importDefault(require("../../utils/translator-api"));
const regenerateVerificationCode_1 = __importDefault(require("../../utils/regenerateVerificationCode"));
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
// const templatePath = path.join(__dirname,'../templates/Verification.hbs');
// const templatePathRest = path.join(__dirname,'../templates/Password.hbs');
// const sourceRest = fs.readFileSync(templatePathRest, 'utf8');
// const source = fs.readFileSync(templatePath, 'utf8');
// const templateRest = handlebars.compile(sourceRest);
// const template = handlebars.compile(source);
const path = require("path");
// Define the directory containing your templates
const templatesDir = path.resolve(process.cwd(), "src/templates");
// Define the filenames of your templates
const verificationFilename = "verification.hbs";
const passwordFilename = "password.hbs";
// Resolve the full paths to the template files
const verificationPath = path.resolve(templatesDir, verificationFilename);
const passwordPath = path.resolve(templatesDir, passwordFilename);
// Read the contents of the template files
const verificationTemplate = fs.readFileSync(verificationPath, "utf8");
const passwordTemplate = fs.readFileSync(passwordPath, "utf8");
// Compile the Handlebars templates
const compiledVerificationTemplate = handlebars.compile(verificationTemplate);
const compiledPasswordTemplate = handlebars.compile(passwordTemplate);
exports.signUp = catchAsync(async (req, res, next) => {
    const { userName, email, password, language } = req.body;
    // check if the email exists
    const userEmail = await User.findOne({ email });
    if (userEmail) {
        throw new AppError("The email is already in use", 400);
    }
    if (!userName || !email || !password) {
        throw new AppError("The user is either missing the username, the email, or the password...Please double check these entries", 400);
    }
    const response = await (0, translator_api_1.default)(language, "welcome", process.env.AZURE_TRANSLATOR_KEY, process.env.TRANSLATOR_ENDPOINT);
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
    await User.findOneAndUpdate({ _id: userId }, { $push: { conversations: conversation.id } });
    await User.findOneAndUpdate({ _id: aiId }, { $push: { conversations: conversation.id } });
    const token = user.createJWT();
    res.status(201).json({ message: "User successfully created", token, user });
});
exports.logIn = catchAsync(async (req, res, next) => {
    const { email, password } = req.body;
    if (!email || !password) {
        throw new AppError("Either the email or the password are missing completely from this submission. Please check to make sure and email and a password are included in your submission.", 400);
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
});
// account-controller.js
exports.logOut = catchAsync(async (req, res, next) => {
    if (req.user) {
        req.logout((err) => {
            if (err) {
                throw new AppError("Something went wrong, please try again", 500);
            }
            return res
                .status(200)
                .json({ message: "User logged out successfully" });
        });
    }
    else {
        res.status(400).json({ message: "Log out failed" });
    }
});
/**
 * Login with Phone Number
 * @param {string} phoneNumber
 * sends a verification code to the user's phone number
 * we will send the sms using react-native-sms package
 */
const loginWithPhoneNumber = async (req, res, next) => {
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
        const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
        user.verificationCode = verificationCode;
        await user.save();
        res.status(200).json({
            status: "Success",
            message: "Verification code generated successfully",
            verificationCode,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.loginWithPhoneNumber = loginWithPhoneNumber;
exports.forgotPassword = catchAsync(async (req, res, next) => {
    const { email } = req.body;
    if (!email)
        next(new AppError("please specify your email address", 404));
    const user = await User.findOne({ email });
    if (!user)
        next(new AppError("no user found with this email address", 404));
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
    transporter.sendMail({
        from: process.env.NODEMAILER_USER, // sender address
        to: email, // list of receivers
        subject: "Talckatoo Reset Password", // Subject line
        html: html, // plain text body
    }, (err) => next(new AppError(err.message, 404)));
    res.status(200).json({
        status: "success",
        message: "reset url sent to your email",
    });
});
exports.resetPassword = catchAsync(async (req, res, next) => {
    const { token } = req.params;
    const { password } = req.body;
    const decoded = crypto.createHash("sha256").update(token).digest("hex");
    const user = await User.findOne({ passwordResetToken: decoded });
    if (!user)
        next(new AppError("no user found with this token", 404));
    if (!(user.passwordResetTokenExpires > Date.now()))
        next(new AppError("The password reset token has expired please try again", 404));
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
});
// login with google account
exports.loginWithGoogle = (req, res, next) => {
    passport.authenticate("google", {
        scope: ["profile", "email"],
    })(req, res, next);
};
// Callback after Google has authenticated the user
exports.googleCallback = (req, res, next) => {
    // generate a token on succes
    passport.authenticate("google", { session: false }, (err, user) => {
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
        res.redirect(`${process.env.CLIENT_URL}/?token=${token}&userId=${userData._id}`);
    })(req, res, next);
};
exports.emailVerification = async (req, res, next) => {
    try {
        const { email } = req.body;
        if (!email)
            throw new Error("Please provide an email address");
        const userEmail = await User.findOne({ email });
        if (userEmail) {
            throw new AppError("The email is already in use", 400);
        }
        // Generate verification code
        const verificationCode = (0, regenerateVerificationCode_1.default)();
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
            verificationCode: verificationCode,
        });
    }
    catch (error) {
        console.error(error);
        res.status(400).json({ message: error.message });
    }
};
exports.newsLetter = async (req, res, next) => {
    try {
        const { email } = req.body;
        if (!email)
            throw new Error("Please provide an email address");
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
    }
    catch (error) {
        console.error(error);
        res.status(400).json({ message: error.message });
    }
};
