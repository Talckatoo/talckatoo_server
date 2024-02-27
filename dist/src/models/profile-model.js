"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const profileSchema = new mongoose_1.Schema({
    firstName: {
        type: String,
        minlength: 3,
    },
    lastName: {
        type: String,
        minlength: 3,
    },
    country: {
        type: String,
    },
}, { timestamps: true });
const Profile = (0, mongoose_1.model)("Profile", profileSchema);
module.exports = Profile;
