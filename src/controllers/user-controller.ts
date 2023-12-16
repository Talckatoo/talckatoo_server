import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
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

/**
 * Controller to get all friends of a user.
 * @param req - Request object.
 * @param res - Response object.
 */
export const getFriends = async (
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

    // GET THE CURRENT USER
    const currentUser = await User.findById(userId);

    const friends = await User.findById(userId)
      .select("friends")
      .populate("friends");

    let contactedUsers: any[] = [];
    let uncontactedUsers: any[] = [];
    let latestMessage;
    let last;

    for (const friend of friends.friends) {
      // Check if there's a shared conversation ID
      const sharedConversation = friend.conversations.find(
        (conversationId: any) =>
          currentUser.conversations.includes(conversationId)
      );

      const populateOptions = {
        path: "messages",
        select: "_id createdAt updatedAt message voiceNote",
      };

      // get the conversation object
      const conversation = sharedConversation
        ? await Conversation.findById(sharedConversation).populate(
            populateOptions
          )
        : null;

      if (conversation) {
        last = conversation.messages.pop();
      }

      if (last.message) {
        latestMessage = last.message;
      } else if (last.voiceNote) {
        latestMessage = "voiceNote";
      }

      if (sharedConversation) {
        contactedUsers.push({
          _id: friend._id,
          userName: friend.userName,
          conversation: conversation,
          profileImage: friend.profileImage,
          language: friend.language,
          latestMessage: latestMessage ? latestMessage : null,
        });
      } else {
        uncontactedUsers.push({
          _id: friend._id,
          userName: friend.userName,
          profileImage: friend.profileImage,
          language: friend.language,
        });
      }
    }

    res.status(200).json({
      status: "Success",
      users: {
        contactedUsers,
        uncontactedUsers,
      },
    });
  } catch (error) {
    next(error);
  }
};

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
    const { page, limit, fromDate, toDate } = req.query;

    interface QueryParams {
      page?: number;
      limit?: number;
      fromDate?: string;
      toDate?: string;
    }

    const queryParams: QueryParams = {
      page: page ? parseInt(page as string, 10) : 1,
      limit: limit ? parseInt(limit as string, 10) : 10,
      fromDate: fromDate as string,
      toDate: toDate as string,
    };

    const populateOptions: any[] = [
      { path: "users", select: "userName profileImage language" },
      { path: "messages", select: "message sender createdAt voiceNote status" },
    ];

    const conversation = await Conversation.findOne({
      _id: conversationId,
    }).populate(populateOptions);

    if (!conversation) {
      throw new AppError("This conversation does not exist", 404);
    }

    let messages: any[] = conversation.messages;

    if (queryParams.fromDate && queryParams.toDate) {
      const fromDateObj = new Date(queryParams.fromDate);
      const toDateObj = new Date(queryParams.toDate);
      messages = messages.filter((message) => {
        const messageDate = new Date(message.createdAt);
        return messageDate >= fromDateObj && messageDate <= toDateObj;
      });
    }

    messages.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    const startIndex =
      ((queryParams.page || 1) - 1) * (queryParams.limit || 10);
    const endIndex = (queryParams.page || 1) * (queryParams.limit || 10);

    const paginatedMessages = messages.slice(startIndex, endIndex);

    res.status(200).json({
      status: "Success",
      conversation: {
        ...conversation.toObject(),
        messages: paginatedMessages,
      },
    });
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
            secure: true,
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
        profileImage: { public_id: result?.public_id, url: result?.secure_url },
      };
      if (!updateObj.profileImage.public_id) updateObj = {};

      if (userName) updateObj.userName = userName[0];
      if (language) {
        const response = await axios.post(
          process.env.NEW_API_URL,
          {
            text: "welcome",
            target_lang: language[0].toUpperCase(),
          },
          {
            headers: {
              Authorization: `DeepL-Auth-Key ${process.env.AUTH_KEY}`,
              "Content-Type": "application/x-www-form-urlencoded",
            },
          }
        );

        const welcome = response.data.translations[0].text;
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
