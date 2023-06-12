import { Request, Response, NextFunction } from "express";
const multiparty = require("multiparty");
const User = require("../models/user-model");
const Conversation = require("../models/conversation-model");
const catchAsync = require("../../utils/catch-async");
const AppError = require("../../utils/custom-error");
const cloudinary = require("../../utils/cloudinary");

exports.getUsers = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { userId }: any = req.user;
    const users = await User.find({}).select("_id userName conversations");
    const currentUser = await User.findOne({ _id: userId });

    if (users.length < 1) {
      res
        .status(200)
        .json({ status: "Success", message: "There are currently no users" });
    }

    const contactedUsers = users.filter((user: any) => {
      return user.conversations.some((conversationId: any) => {
        if (currentUser.conversations.includes(conversationId)) {
          console.log(conversationId);
        }
        return currentUser.conversations.includes(conversationId);
      });
    });

    const uncontactedUsers = users.filter((user: any) => {
      return !user.conversations.some((conversationId: any) => {
        return currentUser.conversations.includes(conversationId);
      });
    });

    res
      .status(200)
      .json({ status: "Success", users: { contactedUsers, uncontactedUsers } });
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
      { path: "messages", select: "message sender createdAt" },
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
          files.image[0].originalFilename.substr(-4, 4) !== ".png" ||
          files.image[0].originalFilename.substr(-4, 4) !== ".jpg" ||
          files.image[0].originalFilename.substr(-4, 4) !== "jpeg"
        ) {
          return next(
            new AppError(
              "the only image format accepted are .jpg, .png and .jpeg",
              422
            )
          );
        } else {
          result = await cloudinary.uploader.upload(files.image[0].path, {
            folder: "profile",
          });
        }
      }

      const { userName, public_id } = fields;

      if (public_id) cloudinary.uploader.destroy(public_id);

      let updateObj: any = {
        profileImage: { public_id: result?.public_id, url: result?.url },
      };

      if (!updateObj.profileImage.public_id) updateObj = {};

      if (userName) updateObj.userName = userName[0];

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
