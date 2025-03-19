import * as AWS from "aws-sdk";
import Media from "../models/media-model";

const S3_BUCKET_NAME = "talckatoobucket";

export const uploadMediaService = async (
  type: any,
  file: any,
  altText: string
) => {
  AWS.config.update({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION,
  });

  let s3 = new AWS.S3();

  let params = {
    Bucket: S3_BUCKET_NAME,
    Body: file.buffer,
    Key: `${Date.now()}-${file.originalname}`,
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
