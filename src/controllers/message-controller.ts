import { Request, Response, NextFunction } from "express";
const AppError = require("../../utils/custom-error");
const Conversation = require("../models/conversation-model");
const Message = require("../models/message-model");
const catchAsync = require("../../utils/catch-async");

exports.getConversations = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const conversations = await Conversation.find({});

    if (conversations.length < 1) {
      return res
        .status(200)
        .json({ status: "Success", message: "There are no conversations" });
    }

    res.status(200).json({ status: "Success", conversations });
  }
);

exports.getConversation = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { conversationId } = req.params;
    const conversation = await Conversation.find({ _id: conversationId });

    if (!conversation) {
      throw new AppError("This conversation does not exist", 404);
    }
    res.status(200).json({ status: "Success", conversation });
  }
);

exports.getMessages = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const messages = await Message.find({});

    if (messages.length < 1) {
      return res
        .status(200)
        .json({ status: "Success", message: "There are no messages" });
    }
    res.status(200).json({ status: "Success", messages });
  }
);

exports.getMessage = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { messageId } = req.params;
    const message = await Message.findOne({ _id: messageId });

    if (!message) {
      throw new AppError("This message does not exist", 404);
    }
    res.status(200).json({ status: "Success", message });
  }
);

exports.createMessage = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { message: text, to, from } = req.body;

    if (!text || !to || !from) {
      throw new AppError("Invalid Input. Please try again", 400);
    }

    const message = await Message.create({
      message: text,
      sender: from,
    });

    let conversation = await Conversation.findOneAndUpdate(
      { users: { $all: [from, to] } },
      { $push: { messages: message.id } }
    );

    if (!conversation) {
      conversation = await Conversation.create({
        messages: [message.id],
        users: [from, to],
      });
    }

    res.status(201).json({ status: "Success" });
  }
);

exports.editMessage = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { user }: any = req;
    const { messageId } = req.params;
    const { message: text } = req.body;

    if (!text) {
      throw new AppError("message text cannot be left blank", 400);
    }

    const message = await Message.findOne({ _id: messageId });

    if (!message) {
      throw new AppError("This message does not exist", 404);
    }

    if (user.userId != message.sender.toString()) {
      throw new AppError("Not authorized to modify this resource", 403);
    }

    await Message.updateOne({ _id: messageId }, { $set: { message: text } });

    res.status(200).json({ status: "Success" });
  }
);

exports.deleteMessage = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { user }: any = req;
    const { messageId } = req.params;

    const message = await Message.findOne({ _id: messageId });

    if (!message) {
      throw new AppError("This message does not exist", 404);
    }

    if (user.userId != message.sender.toString()) {
      throw new AppError("Not authorized to delete this resource", 403);
    }

    await Conversation.findOneAndUpdate(
      { messages: message.id },
      { $pull: { messages: message.id } }
    );

    await Message.deleteOne({ _id: messageId });

    res.status(200).json({ status: "Success" });
  }
);
