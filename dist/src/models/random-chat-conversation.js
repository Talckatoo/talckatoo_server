"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// classes from mongoose
const mongoose_1 = require("mongoose");
// conversation schema
const conversationSchema = new mongoose_1.Schema({
    user1: {
        userName: String,
        profilePicture: String,
        language: String,
        id: String,
        email: String,
        socketId: String,
    },
    user2: {
        userName: String,
        profilePicture: String,
        language: String,
        id: String,
        email: String,
        socketId: String,
    },
}, { timestamps: true });
const Conversation = (0, mongoose_1.model)("RandomConversation", conversationSchema);
module.exports = Conversation;
