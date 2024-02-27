"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// classes from mongoose
const mongoose_1 = require("mongoose");
// groupConversatoin schema
const GroupConversationSchema = new mongoose_1.Schema({
    name: String,
    createdBy: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    profilePic: {
        url: String,
        public_Id: String,
    },
    defaultLanguages: [String],
}, { timestamps: true });
const GroupConversation = (0, mongoose_1.model)("GroupConversations", GroupConversationSchema);
module.exports = GroupConversation;
