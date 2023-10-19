import { Request, Response, NextFunction } from "express";
const multiparty = require("multiparty");
const User = require("../models/user-model");
const Message = require("../models/message-model");
const Conversation = require("../models/conversation-model");
const catchAsync = require("../../utils/catch-async");
const AppError = require("../../utils/custom-error");
const cloudinary = require("../../utils/cloudinary");
const axios = require("axios");
import { ObjectId } from "mongoose";
import mongoose from "mongoose";

exports.getUsers = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { userId }: any = req.user;
    const currentUser = await User.findOne({ _id: userId });

    const populateOptions = {
      path: "conversations",
      select: "_id createdAt updatedAt unread",
    };

    const contactedUsers = await User.find({
      _id: { $ne: currentUser._id },
      conversations: { $in: currentUser.conversations },
    })
      .select("_id userName conversations profileImage language")
      .populate(populateOptions);

    contactedUsers.forEach((user: any) => {
      user.conversations = user.conversations.filter((conversation: any) => {
        return currentUser.conversations.includes(conversation._id);
      });
    });

    const modifiedUsers = contactedUsers.map((user: any) => {
      return {
        _id: user._id,
        userName: user.userName,
        profileImage: user.profileImage,
        conversation: user.conversations[0],
        conversations: undefined,
        language: user.language,
      };
    });

    modifiedUsers.sort((a: any, b: any) => {
      if (
        a.conversation["updatedAt"].getTime() <
        b.conversation["updatedAt"].getTime()
      ) {
        return 1;
      }

      if (
        a.conversation["updatedAt"].getTime() >
        b.conversation["updatedAt"].getTime()
      ) {
        return -1;
      }

      return 0;
    });

    const uncontactedUsers = await User.find({
      _id: { $ne: currentUser._id },
      conversations: { $nin: currentUser.conversations },
    }).select("_id userName profileImage language");

    if (contactedUsers.length < 1 && uncontactedUsers.length < 1) {
      res
        .status(200)
        .json({ status: "Success", message: "There are currently no users" });
    }

    res.status(200).json({
      status: "Success",
      users: { contactedUsers: modifiedUsers, uncontactedUsers },
    });
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

    const populateOptions = [
      { path: "users", select: "userName _id profileImage language" },
    ];

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
      { path: "users", select: "userName profileImage language" },
      { path: "messages", select: "message sender createdAt voiceNote status" },
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

exports.updateProfile = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { userId } = req.params;

    const form = new multiparty.Form();

    form.parse(req, async function (err: any, fields: any, files: any) {
      let result: any;

      if (files.image) {
        if (
          files.image[0].originalFilename.substr(-4, 4) == ".png" ||
          files.image[0].originalFilename.substr(-4, 4) == ".jpg" ||
          files.image[0].originalFilename.substr(-4, 4) == "jpeg"
        ) {
          result = await cloudinary.uploader.upload(files.image[0].path, {
            folder: "profile",
          });
        } else {
          return next(
            new AppError(
              "the only image format accepted are .jpg, .png and .jpeg",
              422
            )
          );
        }
      }

      const { userName, public_id, language } = fields;

      if (public_id) cloudinary.uploader.destroy(public_id[0]);

      let updateObj: any = {
        profileImage: { public_id: result?.public_id, url: result?.url },
      };
      if (!updateObj.profileImage.public_id) updateObj = {};

      if (userName) updateObj.userName = userName[0];
      if (language) {
        const options = {
          method: "POST",
          url: process.env.TRANSLATE_URL,
          headers: {
            "content-type": "application/json",
            "X-RapidAPI-Key": process.env.TRANSLATE_API_KEY,
            "X-RapidAPI-Host": process.env.API_HOST,
          },
          data: {
            text: "welcome",
            target: language[0],
          },
        };
        const response = await axios.request(options);
        const welcome = response.data[0].result.text;
        updateObj.language = language[0];
        updateObj.welcome = welcome;
      }
      const user = await User.findOneAndUpdate({ _id: userId }, updateObj, {
        new: true,
      });
      if (!user) {
        return next(new AppError("No user found with the provided Id", 404));
      }

      res.status(200).json({
        success: "true",
        user,
      });
    });
  }
);

exports.editUserConversation = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { conversationId, userId } = req.params;

    const populateOptions = [
      { path: "users", select: "userName profileImage language" },
      { path: "messages", select: "message sender createdAt voiceNote status" },
    ];

    let conversation = await Conversation.findOneAndUpdate(
      { _id: conversationId },
      {
        $pull: { unread: userId },
      },
      { new: true }
    ).populate(populateOptions);

    if (!conversation) {
      throw new AppError("This conversation does not exist", 404);
    }

    res.status(200).json({ status: "Success", conversation });
  }
);
