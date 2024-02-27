"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// classes from mongoose
const mongoose_1 = require("mongoose");
// message schema
const messageSchema = new mongoose_1.Schema({
    message: {
        type: String,
        minlength: 1,
        maxlength: 2000,
    },
    sender: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    voiceNote: {
        public_id: String,
        url: String,
    },
    media: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "Media",
        required: false,
    },
    status: {
        type: Boolean,
        default: false,
    },
}, { timestamps: true });
const Message = (0, mongoose_1.model)("Message", messageSchema);
module.exports = Message;
