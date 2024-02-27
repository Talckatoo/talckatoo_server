"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// classes from mongoose
const mongoose_1 = require("mongoose");
const mediaSchema = new mongoose_1.Schema({
    type: {
        type: String,
        required: [true, "type is required"],
    },
    url: {
        type: String,
    },
    altText: {
        type: String,
    },
}, { timestamps: true });
const Media = (0, mongoose_1.model)("Media", mediaSchema);
exports.default = Media;
