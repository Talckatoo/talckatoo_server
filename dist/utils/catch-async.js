"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const catchAsync = (fn) => (req, res, next) => fn(req, res, next).catch(next);
module.exports = catchAsync;
exports.default = catchAsync;
