import { Request, Response, NextFunction } from "express";
import {
  handleFriendRequestResponseService,
  sendFriendRequestService,
} from "../services/friendRequest.service";
import jwt from "jsonwebtoken";

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
    console.log(identifier);
    console.log(decoded);
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
/**
 * Controller to send a friend request.
 * @param req - Request object.
 * @param res - Response object.
 * @param next - Next function.
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
