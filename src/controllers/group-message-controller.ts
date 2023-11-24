import { Request, Response, NextFunction } from "express";

const catchAsync = require("../../utils/catch-async");
const GroupConversation = require("../models/group-conversation-model");
const GroupMessages = require("../models/group-message-model");
const AppError = require("../../utils/custom-error");
const axios = require("axios");

exports.createGroupMessage = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { conversationId, userId } = req.params;
    const conversation = await GroupConversation.findOne({
      _id: conversationId,
    });
    if (!conversation)
      return next(new AppError("no group conversation found for that id", 404));

    const messagesArray = conversation?.defaultLanguages?.map(
      async (language: string) => {
        const { message: text } = req.body;
        const options = {
          method: "POST",
          url: process.env.TRANSLATE_URL,
          headers: {
            "content-type": "application/json",
            "X-RapidAPI-Key": process.env.TRANSLATE_API_KEY,
            "X-RapidAPI-Host": process.env.API_HOST,
          },
          data: {
            text,
            target: language,
          },
        };
        const response = await axios.request(options);
        return { message: response.data[0].result.text, language };
      }
    );

    const translatedMessages = await Promise.all(messagesArray);

    const messages = await GroupMessages.create({
      createdBy: userId,
      messagesArray: translatedMessages,
      conversation,
    });

    res.status(200).json({
      success: "success",
      messages,
    });
  }
);

exports.getGroupMessages = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { conversationId } = req.params;

    const messages = await GroupMessages.find({
      conversation: conversationId,
    }).populate("createdBy");

    res.status(200).json({
      success: "success",
      messages,
    });
  }
);
