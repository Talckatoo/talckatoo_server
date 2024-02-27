"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadMedia = void 0;
const media_service_1 = require("../services/media.service");
const catch_async_1 = __importDefault(require("../../utils/catch-async"));
exports.uploadMedia = (0, catch_async_1.default)(async (req, res, next) => {
    try {
        const { type, altText } = req.body;
        if (!type || !req.file) {
            throw new Error("Please provide all the required fields");
        }
        const media = await (0, media_service_1.uploadMediaService)(type, req.file, altText);
        if (!media) {
            throw new Error("Something went wrong");
        }
        res.status(200).json({
            status: "Success",
            message: "Media uploaded successfully",
            media,
        });
    }
    catch (error) {
        next(error);
    }
});
