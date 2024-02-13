import * as AWS from "aws-sdk";
import * as fs from "fs";
import * as path from "path";
import Media from "../models/media-model";

export const uploadMediaService = async (
  type: any,
  file: any,
  altText: string
) => {
  AWS.config.update({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: "us-east-1",
  });

  let s3 = new AWS.S3();

  let params = {
    Bucket: "talckatoo",
    Body: file.buffer,
    Key: `${Date.now()}-${file.originalname}`,
    ACL: "public-read",
  };

  try {
    const uploadResult = await s3.upload(params).promise();
    const media = await Media.create({
      type,
      url: uploadResult.Location,
      altText,
    });
    return media;
  } catch (error) {
    console.log(error);
  }
};
