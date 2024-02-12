import { Request, NextFunction, Response } from "express";
const RandomConversations = require("../models/random-chat-conversation");
import catchAsync from "../../utils/catch-async";

export const createRandomConversation = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { userName, url } = req.body;

      const RandomUserExists = await RandomConversations.find();

      if (RandomUserExists.length === 0) {
        const addToWaitingList = await RandomConversations.create({
          user1: { userName, url },
        });
        res.status(200).json({
          status: "Success",
          message: "successfully added to waiting list",
        });
      } else {
        const addToWaitingList = await RandomConversations.findOneAndUpdate(
          { _id: RandomUserExists[0] },
          { user2: { userName, url } },
          { new: true }
        );

        await RandomConversations.deleteMany();

        res.status(200).json({
          status: "Success",
          conversation: addToWaitingList,
        });
      }
    } catch (error) {
      next(error);
    }
  }
);
