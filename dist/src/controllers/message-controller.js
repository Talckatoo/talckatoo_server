"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const translator_api_1 = __importDefault(require("../../utils/translator-api"));
const AppError = require("../../utils/custom-error");
const User = require("../models/user-model");
const Conversation = require("../models/conversation-model");
const Message = require("../models/message-model");
const catchAsync = require("../../utils/catch-async");
const cloudinary = require("../../utils/cloudinary");
const multiparty = require("multiparty");
const fs = require("fs");
const axios = require("axios");
exports.getConversations = catchAsync(async (req, res, next) => {
    const conversations = await Conversation.find({});
    if (conversations.length < 1) {
        return res
            .status(200)
            .json({ status: "Success", message: "There are no conversations" });
    }
    res.status(200).json({ status: "Success", conversations });
});
exports.getConversation = catchAsync(async (req, res, next) => {
    const { conversationId } = req.params;
    const conversation = await Conversation.find({ _id: conversationId });
    if (!conversation) {
        throw new AppError("This conversation does not exist", 404);
    }
    res.status(200).json({ status: "Success", conversation });
});
exports.getMessages = catchAsync(async (req, res, next) => {
    const messages = await Message.find({});
    if (messages.length < 1) {
        return res
            .status(200)
            .json({ status: "Success", message: "There are no messages" });
    }
    res.status(200).json({ status: "Success", messages });
});
exports.getMessage = catchAsync(async (req, res, next) => {
    const { messageId } = req.params;
    const message = await Message.findOne({ _id: messageId });
    if (!message) {
        throw new AppError("This message does not exist", 404);
    }
    res.status(200).json({ status: "Success", message });
});
exports.createMessage = catchAsync(async (req, res, next) => {
    const { message: text, to, from, targetLanguage, voiceToVoice, voiceTargetLanguage, media, status, unread, } = req.body;
    const target = targetLanguage ? targetLanguage : "en";
    if (media) {
        const message = await Message.create({
            media: media,
            sender: from,
        });
        let conversation = await Conversation.findOneAndUpdate({ users: { $all: [from, to] } }, {
            $push: { messages: message.id },
            $addToSet: { unread: to },
        }, { new: true });
        if (!conversation) {
            conversation = await Conversation.create({
                messages: [message.id],
                users: [from, to],
                unread: [to],
            });
            await User.findOneAndUpdate({ _id: from }, { $push: { conversations: conversation.id } });
            await User.findOneAndUpdate({ _id: to }, { $push: { conversations: conversation.id } });
        }
        return res.status(201).json({ status: "Success", message });
    }
    if (!text || !to || !from) {
        throw new AppError("Invalid Input. Please try again", 400);
    }
    if (to === from) {
        throw new AppError("You can't send a message to yourself", 403);
    }
    const response = await (0, translator_api_1.default)(target, text, process.env.AZURE_TRANSLATOR_KEY, process.env.TRANSLATOR_ENDPOINT);
    const translate = `\n${response[0]?.text}`;
    if (!voiceToVoice) {
        const message = await Message.create({
            message: text + translate,
            sender: from,
        });
        let conversation = await Conversation.findOneAndUpdate({ users: { $all: [from, to] } }, {
            $push: { messages: message.id },
            $addToSet: { unread: to }, // Push recipientID into the "unread" array if it doesn't already exist
        }, { new: true });
        if (!conversation) {
            conversation = await Conversation.create({
                messages: [message.id],
                users: [from, to],
                unread: [to],
            });
            await User.findOneAndUpdate({ _id: from }, { $push: { conversations: conversation.id } });
            await User.findOneAndUpdate({ _id: to }, { $push: { conversations: conversation.id } });
        }
        res.status(201).json({ status: "Success", message, conversation });
    }
    else {
        const encodedParams = new URLSearchParams();
        encodedParams.set("src", translate);
        encodedParams.set("hl", voiceTargetLanguage);
        encodedParams.set("r", "0");
        encodedParams.set("c", "mp3");
        encodedParams.set("f", "8khz_8bit_mono");
        encodedParams.set("b64", "true");
        const options = {
            method: "POST",
            url: process.env.URL,
            params: {
                key: process.env.VOICE_PARAMS_KEY,
            },
            headers: {
                "content-type": "application/x-www-form-urlencoded",
                "X-RapidAPI-Key": process.env.VOICE_API_KEY,
                "X-RapidAPI-Host": process.env.VOICE_API_HOST,
            },
            data: encodedParams,
        };
        const response = await axios.request(options);
        const audioData = response.data;
        const decodedData = Buffer.from(audioData, "base64");
        // Create a temporary file to store the audio data
        const tempFilePath = "./temp_audio.mp3";
        fs.writeFileSync(tempFilePath, decodedData);
        const uploadOptions = {
            resource_type: "video",
            format: "mp3",
            folder: "voice-notes",
        };
        cloudinary.uploader.upload_large(tempFilePath, uploadOptions, async (error, result) => {
            // Delete the temporary file
            fs.unlinkSync(tempFilePath);
            if (error) {
                console.log(error);
            }
            else {
                const { public_id, secure_url } = result;
                const message = await Message.create({
                    voiceNote: { public_id, url: secure_url },
                    sender: from,
                });
                let conversation = await Conversation.findOneAndUpdate({ users: { $all: [from, to] } }, {
                    $push: { messages: message.id },
                    $addToSet: { unread: to }, // Push recipientID into the "unread" array if it doesn't already exist
                }, { new: true });
                if (!conversation) {
                    conversation = await Conversation.create({
                        messages: [message.id],
                        users: [from, to],
                        unread: [to],
                    });
                    await User.findOneAndUpdate({ _id: from }, { $push: { conversations: conversation.id } });
                    await User.findOneAndUpdate({ _id: to }, { $push: { conversations: conversation.id } });
                }
                res.status(201).json({ status: "Success", message, conversation });
            }
        });
    }
});
exports.createVoiceNote = catchAsync(async (req, res, next) => {
    const form = new multiparty.Form();
    form.parse(req, async (err, fields) => {
        const { to, from, url } = req.body;
        if (!url) {
            throw new AppError("Invalid Input. Please try again", 400);
        }
        if (!to || !from) {
            throw new AppError("Invalid Input. Please try again", 400);
        }
        if (to === from) {
            throw new AppError("You can't send a message to yourself", 403);
        }
        const message = await Message.create({
            voiceNote: { url: url },
            sender: from,
        });
        let conversation = await Conversation.findOneAndUpdate({ users: { $all: [from, to] } }, { $push: { messages: message.id } });
        if (!conversation) {
            conversation = await Conversation.create({
                messages: [message.id],
                users: [from, to],
            });
            await User.findOneAndUpdate({ _id: from }, { $push: { conversations: conversation.id } });
            await User.findOneAndUpdate({ _id: to }, { $push: { conversations: conversation.id } });
        }
        res.status(201).json({ message });
    });
});
exports.editMessage = catchAsync(async (req, res, next) => {
    const { userId } = req.user;
    const { messageId } = req.params;
    const { message: text } = req.body;
    if (!text) {
        throw new AppError("message text cannot be left blank", 400);
    }
    const message = await Message.findOne({ _id: messageId });
    if (!message) {
        throw new AppError("This message does not exist", 404);
    }
    if (userId != message.sender.toString()) {
        throw new AppError("Not authorized to modify this resource", 403);
    }
    await Message.updateOne({ _id: messageId }, { $set: { message: text } });
    res.status(200).json({ status: "Success" });
});
exports.deleteMessage = catchAsync(async (req, res, next) => {
    const { userId } = req.user;
    const { messageId } = req.params;
    const message = await Message.findOne({ _id: messageId });
    if (!message) {
        throw new AppError("This message does not exist", 404);
    }
    if (userId != message.sender.toString()) {
        throw new AppError("Not authorized to delete this resource", 403);
    }
    await Conversation.findOneAndUpdate({ messages: message.id }, { $pull: { messages: message.id } });
    await Message.deleteOne({ _id: messageId });
    res.status(200).json({ status: "Success" });
});
exports.deleteVoiceNote = catchAsync(async (req, res, next) => {
    const { userId } = req.user;
    const { messageId } = req.params;
    const form = new multiparty.Form();
    form.parse(req, async (err, fields, files) => {
        const { public_id } = fields;
        const message = await Message.findOne({ _id: messageId });
        if (!message) {
            throw new AppError("This message does not exist", 404);
        }
        if (userId != message.sender.toString()) {
            throw new AppError("Not authorized to delete this resource", 403);
        }
        await Conversation.findOneAndUpdate({ messages: message.id }, { $pull: { messages: message.id } });
        await Message.deleteOne({ _id: messageId });
        cloudinary.uploader.destroy(public_id, { resource_type: "video" });
        res.status(200).json({ status: "Success" });
    });
});
/// voice-translate
// exports.createVoiceTranslate = catchAsync(
//   async (req: Request, res: Response, next: NextFunction) => {
//     res.status(200).json({
//       status: "success",
//       data: response.data,
//     });
//   }
// );
