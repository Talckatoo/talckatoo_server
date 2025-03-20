"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserKey = void 0;
// classes from mongoose
const mongoose_1 = require("mongoose");
const userKeySchema = new mongoose_1.Schema({
    userId: {
        type: String,
        ref: "User",
        required: true,
        unique: true,
    },
    publicKey: { type: String, required: true },
    privateKey: { type: String, required: true },
});
exports.UserKey = (0, mongoose_1.model)("UserKey", userKeySchema);
