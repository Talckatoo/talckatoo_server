import { Request, Response, NextFunction } from "express";
import catchAsync from "../../utils/catch-async";
const AppError = require("../../utils/custom-error");
import { UserKey } from "../models/userKey-model";

interface User {
  userId: string;
  userName: string;
  email: string;
  iat: number;
  exp: number;
}

declare module "express-serve-static-core" {
  interface Request {
    user?: User;
  }
}

exports.getPrivateKey = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    if (req.user?.userId != req.params.userId) {
      throw new AppError("Not authorized", 403);
    }
    const { userId } = req.params;

    const userKeys = await UserKey.findOne(
      { userId },
      "-_id publicKey privateKey"
    );

    if (!userKeys) {
      throw new AppError("Keys not found", 404);
    }

    res.status(200).json({ status: "success", data: { userKeys } });
  }
);

exports.getPublicKeys = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const userKeys = await UserKey.find({}, "userId publicKey -_id");

    if (!userKeys) {
      throw new AppError("No public keys found", 404);
    }

    res.status(200).json({ status: "success", data: { userKeys } });
  }
);
