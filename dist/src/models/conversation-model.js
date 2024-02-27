"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// classes from mongoose
const mongoose_1 = require("mongoose");
// conversation schema
const conversationSchema = new mongoose_1.Schema({
    messages: [
        {
            type: mongoose_1.Schema.Types.ObjectId,
            ref: "Message",
        },
    ],
    users: [
        {
            type: mongoose_1.Schema.Types.ObjectId,
            ref: "User",
        },
    ],
    unread: [
        {
            type: String, // recipientID
        },
    ],
    // latestMessage: {
    //   type: String,
    // },
}, { timestamps: true });
const Conversation = (0, mongoose_1.model)("Conversation", conversationSchema);
module.exports = Conversation;
