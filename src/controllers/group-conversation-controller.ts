import { Request, Response, NextFunction } from "express";

const catchAsync = require("../../utils/catch-async");
const GroupConversation = require("../models/group-conversation-model");
const User = require("../models/user-model");
const multiparty = require("multiparty");
const cloudinary = require("../../utils/cloudinary");
const AppError = require("../../utils/custom-error");

exports.createGroup = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { userId } = req.params;

    const form = new multiparty.Form();

    form.parse(req, async function (err: any, fields: any, files: any) {
      let result: any;
      try {
        if (files.image) {
          if (
            files.image[0].originalFilename.substr(-4, 4) == ".png" ||
            files.image[0].originalFilename.substr(-4, 4) == ".jpg" ||
            files.image[0].originalFilename.substr(-4, 4) == "jpeg"
          ) {
            result = await cloudinary.uploader.upload(files.image[0].path, {
              folder: "groupConversationProfile",
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
      } catch (err) {
        throw new AppError("Error", 404);
      }

      const { name, defaultLanguages } = fields;

      const createObj: any = {
        profilePic: { public_id: result?.public_id, url: result?.secure_url },
        createdBy: userId,
      };

      if (name) createObj.name = name[0];
      if (defaultLanguages)
        createObj.defaultLanguages = JSON.parse(defaultLanguages[0]);

      const groupConversation = await GroupConversation.create(createObj);
      await User.findByIdAndUpdate(
        userId,
        { $push: { groups: groupConversation._id } },
        { new: true }
      );

      res.status(200).json({
        success: "success",
        groupConversation,
      });
    });
  }
);

exports.joinGroup = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { conversationId, userId } = req.params;

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $push: { groups: conversationId } },
      { new: true }
    );

    res.status(200).json({
      success: "success",
      user: updatedUser,
    });
  }
);

exports.getUserGroups = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { userId } = req.params;

    const user = await User.findById(userId)
      .select("groups")
      .populate("groups");
    if (!user) {
      return res.status(404).json({
        error: "User not found",
      });
    }

    res.status(200).json({
      success: "success",
      groups: user.groups,
    });
  }
);
