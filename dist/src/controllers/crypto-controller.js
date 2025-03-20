"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const catch_async_1 = __importDefault(require("../../utils/catch-async"));
const AppError = require("../../utils/custom-error");
const userKey_model_1 = require("../models/userKey-model");
exports.getPrivateKey = (0, catch_async_1.default)(async (req, res, next) => {
    if (req.user?.userId != req.params.userId) {
        throw new AppError("Not authorized", 403);
    }
    const { userId } = req.params;
    const userKeys = await userKey_model_1.UserKey.findOne({ userId }, "-_id publicKey privateKey");
    if (!userKeys) {
        throw new AppError("Keys not found", 404);
    }
    res.status(200).json({ status: "success", data: { userKeys } });
});
exports.getPublicKeys = (0, catch_async_1.default)(async (req, res, next) => {
    const userKeys = await userKey_model_1.UserKey.find({}, "userId publicKey -_id");
    if (!userKeys) {
        throw new AppError("No public keys found", 404);
    }
    res.status(200).json({ status: "success", data: { userKeys } });
});
