"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadMediaService = void 0;
const client_s3_1 = require("@aws-sdk/client-s3");
const media_model_1 = __importDefault(require("../models/media-model"));
const uploadMediaService = async (type, file, altText) => {
    // Initialize S3 Client
    const s3 = new client_s3_1.S3Client({
        region: process.env.AWS_REGION,
        credentials: {
            accessKeyId: process.env.AWS_ACCESS_KEY_ID,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        },
    });
    // Set S3 upload parameters
    const params = {
        Bucket: process.env.S3_BUCKET_NAME,
        Key: `${Date.now()}-${file.originalname}`, // Unique file name
        Body: file.buffer,
        ContentType: file.mimetype, // Set correct content type
    };
    try {
        // Upload file to S3
        await s3.send(new client_s3_1.PutObjectCommand(params));
        // Construct file URL
        const fileUrl = `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${params.Key}`;
        // Save metadata to MongoDB
        const media = await media_model_1.default.create({
            type,
            url: fileUrl,
            altText,
        });
        return media;
    }
    catch (error) {
        console.error("S3 Upload Error:", error);
        throw new Error("File upload failed");
    }
};
exports.uploadMediaService = uploadMediaService;
