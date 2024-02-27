"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const catchAsync = require("../../utils/catch-async");
exports.mainController = catchAsync(async (req, res, next) => {
    res.status(200).json({
        success: "hello you're welcome to my Api",
    });
});
