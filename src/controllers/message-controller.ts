import { Request, Response, NextFunction } from "express";
const AppError = require("../../utils/custom-error");
const User = require("../models/user-model");
const Conversation = require("../models/conversation-model");
const Message = require("../models/message-model");
const catchAsync = require("../../utils/catch-async");
const cloudinary = require("../../utils/cloudinary");
const multiparty = require("multiparty");

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

    if (to === from) {
      throw new AppError("You can't send a message to yourself", 403);
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

      const currentUser = await User.findOneAndUpdate(
        { _id: from },
        { $push: { conversations: conversation.id } }
      );

      const messagedUser = await User.findOneAndUpdate(
        { _id: to },
        { $push: { conversations: conversation.id } }
      );
    }

    res.status(201).json({ status: "Success", message });
  }
);

exports.createVoiceNote = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const form = new multiparty.Form();

    form.parse(req, async (err: any, fields: any, files: any) => {
      const { to, from } = fields;

      if (!to || !from) {
        throw new AppError("Invalid Input. Please try again", 400);
      }

      if (to === from) {
        throw new AppError("You can't send a message to yourself", 403);
      }

      if (files.audio) {
        const data = await cloudinary.uploader.upload(files.audio[0].path, {
          resource_type: "video",
          folder: "voice-notes",
        });
        const { public_id, url } = data;
        const message = await Message.create({
          voiceNote: { public_id, url },
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

          await User.findOneAndUpdate(
            { _id: from },
            { $push: { conversations: conversation.id } }
          );

          await User.findOneAndUpdate(
            { _id: to },
            { $push: { conversations: conversation.id } }
          );
        }
        res.status(201).json({ message });
      }
    });
  }
);

exports.editMessage = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { userId }: any = req.user;
    const { messageId } = req.params;
    const { message: text } = req.body;

    if (!text) {
      throw new AppError("message text cannot be left blank", 400);
    }

    const message = await Message.findOne({ _id: messageId });

    if (!message) {
      throw new AppError("This message does not exist", 404);
    }

    if (userId != message.sender.toString()) {
      throw new AppError("Not authorized to modify this resource", 403);
    }

    await Message.updateOne({ _id: messageId }, { $set: { message: text } });

    res.status(200).json({ status: "Success" });
  }
);

exports.deleteMessage = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { userId }: any = req.user;
    const { messageId } = req.params;

    const message = await Message.findOne({ _id: messageId });

    if (!message) {
      throw new AppError("This message does not exist", 404);
    }

    if (userId != message.sender.toString()) {
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
exports.deleteVoiceNote = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { userId }: any = req.user;
    const { messageId } = req.params;
    const form = new multiparty.Form();

    form.parse(req, async (err: any, fields: any, files: any) => {
      const { public_id } = fields;

      const message = await Message.findOne({ _id: messageId });

      if (!message) {
        throw new AppError("This message does not exist", 404);
      }

      if (userId != message.sender.toString()) {
        throw new AppError("Not authorized to delete this resource", 403);
      }

      await Conversation.findOneAndUpdate(
        { messages: message.id },
        { $pull: { messages: message.id } }
      );

      await Message.deleteOne({ _id: messageId });

      cloudinary.uploader.destroy(public_id, { resource_type: "video" });
      res.status(200).json({ status: "Success" });
    });
  }
);
