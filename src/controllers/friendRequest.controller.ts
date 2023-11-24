import { Request, Response, NextFunction } from "express";
import {
  getFriendRequestsService,
  handleFriendRequestResponseService,
  sendFriendRequestService,
} from "../services/friendRequest.service";
import jwt from "jsonwebtoken";
const User = require("../models/user-model");

/**
 * Controller to get all friend requests.
 * @param req - Request object.
 * @param res - Response object.
 * @param next - Next function.
 */
export const getFriendRequests = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Extract the JWT token from the Authorization header
    const token = req.header("Authorization")?.replace("Bearer ", "");

    // Decode the token to get user data
    let decoded: any;
    if (token) {
      decoded = jwt.verify(token, process.env.JWT_SECRET!);
    }

    // The "from" user is the one who owns the token
    const userId = decoded?.userId;

    const friendRequests = await getFriendRequestsService(userId);
    res.status(200).json({ friendRequests });
  } catch (error) {
    next(error);
  }
};

/**
 * Controller to send a friend request.
 * @param req - Request object.
 * @param res - Response object.
 * @param next - Next function.
 */
export const sendFriendRequest = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Extract the JWT token from the Authorization header
    const token = req.header("Authorization")?.replace("Bearer ", "");

    // Decode the token to get user data
    let decoded: any;
    if (token) {
      decoded = jwt.verify(token, process.env.JWT_SECRET!);
    }

    // The "from" user is the one who owns the token
    const fromUserId = decoded?.userId;

    // "to" user is the one to whom the friend request is sent
    const { identifier } = req.body;
    const message = await sendFriendRequestService(fromUserId, identifier);
    res.status(200).json({ message });
  } catch (error) {
    next(error);
  }
};

/**
 * Controller to accept a friend request.
 * @param req - Request object.
 * @param res - Response object.
 * @param next - Next function.
 * @returns
 */

export const handleFriendRequestResponse = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Extract the JWT token from the Authorization header
    const token = req.header("Authorization")?.replace("Bearer ", "");

    // Decode the token to get user data
    let decoded: any;
    if (token) {
      decoded = jwt.verify(token, process.env.JWT_SECRET!);
    }

    // The "from" user is the one who owns the token
    const toUserId = decoded?.userId;

    // "to" user is the one to whom the friend request is sent
    const { friendRequestId, action } = req.body;

    const message = await handleFriendRequestResponseService(
      toUserId,
      friendRequestId,
      action
    );
    res.status(200).json({ message });
  } catch (error) {
    next(error);
  }
};

export const handleFindUsers = async (req: Request, res: Response) => {
  const { identifier } = req.body;
  let query;
  if (identifier.includes("@")) {
    query = { email: identifier };
  } else if (/^\d+$/.test(identifier)) {
    query = { phoneNumber: identifier };
  } else {
    query = { userName: identifier };
  }

  const seachedUser = await User.findOne(query);
  res.status(200).json({ seachedUser });
};
