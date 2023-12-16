const nodemailer = require("nodemailer");
import { NextFunction } from "express";
const AppError = require("./custom-error");

const mailConstructor = (email: any, resetToken: any, next: NextFunction) => {
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
      text: `Click the following link to reset your password: http://127.0.0.1:8000/api/v1/account/reset-password/${resetToken}`,
    },
    (err: any) => next(new AppError(err.message, 404))
  );
};

module.exports = mailConstructor;
