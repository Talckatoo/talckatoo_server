"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const newsletterEmailSchema = new mongoose_1.default.Schema({
    email: {
        type: String,
        required: true,
        unique: true, // Ensures each email is unique in the collection
        trim: true,
        lowercase: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});
const NewsletterEmail = mongoose_1.default.model('NewsletterEmail', newsletterEmailSchema);
exports.default = NewsletterEmail;
