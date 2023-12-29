import { uploadMediaService } from "../services/media.service";
import { Request as ExpressRequest, NextFunction, Response } from "express";
import * as multer from "multer";
import catchAsync from "../../utils/catch-async";

interface RequestWithFile extends ExpressRequest {
  file: Express.Multer.File;
}

export const uploadMedia = catchAsync(
  async (req: RequestWithFile, res: Response, next: NextFunction) => {
    try {
      const { type, altText } = req.body;

      if (!type || !req.file) {
        throw new Error("Please provide all the required fields");
      }

      const media = await uploadMediaService(type, req.file, altText);

      if (!media) {
        throw new Error("Something went wrong");
      }

      res.status(200).json({
        status: "Success",
        message: "Media uploaded successfully",
        media,
      });
    } catch (error) {
      next(error);
    }
  }
);
