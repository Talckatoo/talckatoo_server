import { Request, Response, NextFunction } from "express";

const catchAsync = require("../../utils/catch-async");

exports.mainController = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    res.status(201).json({
      success: "hello you're welcome to my Api",
    });
  }
);
