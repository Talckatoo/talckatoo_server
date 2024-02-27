"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadMediaService = void 0;
const AWS = __importStar(require("aws-sdk"));
const media_model_1 = __importDefault(require("../models/media-model"));
const uploadMediaService = async (type, file, altText) => {
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
        const media = await media_model_1.default.create({
            type,
            url: uploadResult.Location,
            altText,
        });
        return media;
    }
    catch (error) {
        console.log(error);
    }
};
exports.uploadMediaService = uploadMediaService;
