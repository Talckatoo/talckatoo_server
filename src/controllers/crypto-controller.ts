import { Request, Response, NextFunction } from "express";
import catchAsync from "../../utils/catch-async";
const AppError = require("../../utils/custom-error");
import { UserKey } from "../models/userKey-model";

exports.getKeys = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { userId } = req.params;

    const userKey = await UserKey.findOne({ userId });

    if (!userKey) {
      throw new AppError("Keys not found", 404);
    }

    res.status(200).json({ status: "success", data: { userKey } });
  }
);
