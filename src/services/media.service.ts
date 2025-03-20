import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import Media from "../models/media-model";

export const uploadMediaService = async (
  type: string,
  file: Express.Multer.File,
  altText: string
) => {
  // Initialize S3 Client
  const s3 = new S3Client({
    region: process.env.AWS_REGION!,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
  });

  // Set S3 upload parameters
  const params = {
    Bucket: process.env.S3_BUCKET_NAME!,
    Key: `${Date.now()}-${file.originalname}`, // Unique file name
    Body: file.buffer,
    ContentType: file.mimetype, // Set correct content type
  };

  try {
    // Upload file to S3
    await s3.send(new PutObjectCommand(params));

    // Construct file URL
    const fileUrl = `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${params.Key}`;

    // Save metadata to MongoDB
    const media = await Media.create({
      type,
      url: fileUrl,
      altText,
    });

    return media;
  } catch (error) {
    console.error("S3 Upload Error:", error);
    throw new Error("File upload failed");
  }
};
