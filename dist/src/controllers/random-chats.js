"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createRandomConversation = void 0;
const RandomConversations = require("../models/random-chat-conversation");
const catch_async_1 = __importDefault(require("../../utils/catch-async"));
exports.createRandomConversation = (0, catch_async_1.default)(async (req, res, next) => {
    try {
        const { userName, url } = req.body;
        const RandomUserExists = await RandomConversations.find();
        if (RandomUserExists.length === 0) {
            const addToWaitingList = await RandomConversations.create({
                user1: { userName, url },
            });
            res.status(200).json({
                status: "Success",
                message: "successfully added to waiting list",
            });
        }
        else {
            const addToWaitingList = await RandomConversations.findOneAndUpdate({ _id: RandomUserExists[0] }, { user2: { userName, url } }, { new: true });
            await RandomConversations.deleteMany();
            res.status(200).json({
                status: "Success",
                conversation: addToWaitingList,
            });
        }
    }
    catch (error) {
        next(error);
    }
});
