import { Request, Response, NextFunction } from "express";

const catchAsync = require("../../utils/catch-async");
const GroupConversation = require("../models/group-conversation-model");
const User = require("../models/user-model");
const multiparty = require("multiparty");
const cloudinary = require("../../utils/cloudinary");

exports.createGroup = catchAsync(
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

      const { name, defaultLanguages } = fields;

      const createObj: any = {
        profilePic: { public_id: result?.public_id, url: result?.secure_url },
        createdBy: userId,
      };
      console.log(name);

      if (name) createObj.name = name[0];
      if (defaultLanguages)
        createObj.defaultLanguages = JSON.parse(defaultLanguages[0]);

      const groupConversation = await GroupConversation.create(createObj);

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

    // Update the user document to add the conversation to the 'groups' array.
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $push: { groups: conversationId } }, // Use $push to add the conversation to the 'groups' array
      { new: true } // Return the updated user document
    );

    res.status(200).json({
      success: "success",
      user: updatedUser,
    });
  }
);
