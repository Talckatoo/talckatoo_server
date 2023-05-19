import { Request, Response, NextFunction } from "express";
const User = require("../models/user-model");
const catchAsync = require("../../utils/catch-async");
const jwt = require("jsonwebtoken");

exports.signUp = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    res.status(201).json({
      success: "signUp",
    });
  }
);
