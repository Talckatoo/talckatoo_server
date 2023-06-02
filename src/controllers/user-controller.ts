import { Request, Response, NextFunction } from "express";
const User = require("../models/user-model");
const Conversation = require("../models/conversation-model");
const catchAsync = require("../../utils/catch-async");
const AppError = require("../../utils/custom-error");

exports.getUsers = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const users = await User.find({});

    if (users.length < 1) {
      res
        .status(200)
        .json({ status: "Success", message: "There are currently no users" });
    }

    res.status(200).json({ status: "Success", users });
  }
);

exports.getUser = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { userId } = req.params;

    const user = await User.findOne({ _id: userId });

    if (!user) {
      throw new AppError("This user does not exist", 404);
    }

    res.status(200).json({ status: "Success", user });
  }
);

exports.getUserConversations = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { userId } = req.params;

    const populateOptions = [{ path: "users", select: "userName _id" }];

    const conversations = await Conversation.find({ users: userId }).populate(
      populateOptions
    );

    if (conversations.length < 1) {
      res
        .status(200)
        .json({ status: "Success", message: "This user has no conversations" });
    }

    res.status(200).json({ status: "Success", conversations });
  }
);

exports.getUserConversation = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { conversationId } = req.params;

    const populateOptions = [
      { path: "users", select: "userName" },
      { path: "messages", select: "message" },
    ];

    const conversation = await Conversation.findOne({
      _id: conversationId,
    }).populate(populateOptions);

    if (!conversation) {
      throw new AppError("This conversation does not exist", 404);
    }

    res.status(200).json({ status: "Success", conversation });
  }
);
