"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleFindUsers = exports.handleFriendRequestResponse = exports.sendFriendRequest = exports.getFriendRequests = void 0;
const friendRequest_service_1 = require("../services/friendRequest.service");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const User = require("../models/user-model");
/**
 * Controller to get all friend requests.
 * @param req - Request object.
 * @param res - Response object.
 * @param next - Next function.
 */
const getFriendRequests = async (req, res, next) => {
    try {
        // Extract the JWT token from the Authorization header
        const token = req.header("Authorization")?.replace("Bearer ", "");
        // Decode the token to get user data
        let decoded;
        if (token) {
            decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        }
        // The "from" user is the one who owns the token
        const userId = decoded?.userId;
        const friendRequests = await (0, friendRequest_service_1.getFriendRequestsService)(userId);
        res.status(200).json({ friendRequests });
    }
    catch (error) {
        next(error);
    }
};
exports.getFriendRequests = getFriendRequests;
/**
 * Controller to send a friend request.
 * @param req - Request object.
 * @param res - Response object.
 * @param next - Next function.
 */
const sendFriendRequest = async (req, res, next) => {
    try {
        // Extract the JWT token from the Authorization header
        const token = req.header("Authorization")?.replace("Bearer ", "");
        // Decode the token to get user data
        let decoded;
        if (token) {
            decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        }
        // The "from" user is the one who owns the token
        const fromUserId = decoded?.userId;
        // "to" user is the one to whom the friend request is sent
        const { identifier } = req.body;
        const message = await (0, friendRequest_service_1.sendFriendRequestService)(fromUserId, identifier);
        res.status(200).json(message);
    }
    catch (error) {
        next(error);
    }
};
exports.sendFriendRequest = sendFriendRequest;
/**
 * Controller to accept a friend request.
 * @param req - Request object.
 * @param res - Response object.
 * @param next - Next function.
 * @returns
 */
const handleFriendRequestResponse = async (req, res, next) => {
    try {
        // Extract the JWT token from the Authorization header
        const token = req.header("Authorization")?.replace("Bearer ", "");
        // Decode the token to get user data
        let decoded;
        if (token) {
            decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        }
        // The "from" user is the one who owns the token
        const toUserId = decoded?.userId;
        // "to" user is the one to whom the friend request is sent
        const { friendRequestId, action } = req.body;
        const message = await (0, friendRequest_service_1.handleFriendRequestResponseService)(toUserId, friendRequestId, action);
        res.status(200).json(message);
    }
    catch (error) {
        next(error);
    }
};
exports.handleFriendRequestResponse = handleFriendRequestResponse;
const handleFindUsers = async (req, res) => {
    const { identifier } = req.body;
    // Extract the JWT token from the Authorization header
    const token = req.header("Authorization")?.replace("Bearer ", "");
    // Decode the token to get user data
    let decoded;
    if (token) {
        decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
    }
    // The "from" user is the one who owns the token
    const userId = decoded?.userId;
    let query;
    if (identifier.includes("@")) {
        query = { email: identifier };
    }
    else if (/^\d+$/.test(identifier)) {
        query = { phoneNumber: identifier };
    }
    else {
        query = { userName: identifier };
    }
    const seachedUser = await User.findOne(query);
    if (!seachedUser) {
        return res.status(404).json({ message: "User not found" });
    }
    if (seachedUser._id.toString() === userId) {
        return res.status(400).json({ message: "Cannot send to self" });
    }
    return res.status(200).json({ seachedUser });
};
exports.handleFindUsers = handleFindUsers;
