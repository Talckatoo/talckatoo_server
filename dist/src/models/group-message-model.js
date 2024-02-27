"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// classes from mongoose
const mongoose_1 = require("mongoose");
// groupMessage schema
const groupMessageSchema = new mongoose_1.Schema({
    messagesArray: [{ message: String, language: String }],
    createdBy: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    conversation: mongoose_1.Schema.Types.ObjectId,
}, { timestamps: true });
const GroupMessage = (0, mongoose_1.model)("GroupMessages", groupMessageSchema);
module.exports = GroupMessage;
