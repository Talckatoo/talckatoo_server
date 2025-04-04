"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getFriendRequestsService = exports.handleFriendRequestResponseService = exports.sendFriendRequestService = void 0;
const user_model_1 = __importDefault(require("../models/user-model"));
const friendRequest_model_1 = __importDefault(require("../models/friendRequest-model"));
const Conversation = require("../models/conversation-model");
// Error Constants
const ERR_USER_NOT_FOUND = "User not found";
const ERR_CANNOT_SEND_TO_SELF = "You cannot send a friend request to yourself";
const ERR_REQUEST_ALREADY_SENT = "Friend request already sent";
const ERR_INVITATION_NOT_FOUND = "Friend request not found";
const ERR_INVALID_ACTION = "Invalid action";
var FriendRequestStatus;
(function (FriendRequestStatus) {
    FriendRequestStatus["PENDING"] = "pending";
    FriendRequestStatus["ACCEPTED"] = "accepted";
    FriendRequestStatus["REJECTED"] = "rejected";
})(FriendRequestStatus || (FriendRequestStatus = {}));
/**
 * Identify the target user based on the provided identifier (email, phoneNumber, userName).
 * @param identifier - User identifier.
 */
async function findTargetUser(identifier) {
    let query;
    if (identifier.includes("@")) {
        query = { email: identifier };
    }
    else if (/^\d+$/.test(identifier)) {
        query = { phoneNumber: identifier };
    }
    else {
        query = { _id: identifier };
    }
    return user_model_1.default.findOne(query);
}
/**
 * Service to send a friend request.
 * @param fromUserId - Sender's user ID.
 * @param identifier - Target user identifier.
 */
const sendFriendRequestService = async (fromUserId, identifier) => {
    // Step 1: Find Target User
    const targetUser = await findTargetUser(identifier);
    if (!targetUser) {
        throw new Error(ERR_USER_NOT_FOUND);
    }
    // Step 2: Validate Sender and Recipient
    if (fromUserId === targetUser._id.toString()) {
        throw new Error(ERR_CANNOT_SEND_TO_SELF);
    }
    // Step 3: Check for existing friend requests
    const existingFriendRequest = await friendRequest_model_1.default.findOne({
        from: fromUserId,
        to: targetUser._id,
    });
    if (existingFriendRequest) {
        throw new Error(ERR_REQUEST_ALREADY_SENT);
    }
    // Step 4: Create New Friend Request
    const friendRequest = new friendRequest_model_1.default({
        from: fromUserId,
        to: targetUser._id,
    });
    await friendRequest.save();
    // Step 5: Update Users' friendRequests Array
    await user_model_1.default.updateOne({ _id: targetUser._id }, { $push: { friendRequests: friendRequest._id } });
    await user_model_1.default.updateOne({ _id: fromUserId }, { $push: { friendRequests: friendRequest._id } });
    // Step 6: get the friend request data
    const friendRequestData = await friendRequest_model_1.default
        .findById(friendRequest._id)
        .populate("from", "userName")
        .populate("to", "userName")
        .exec();
    // step 7: create a conversation between the two users
    const conversation = await Conversation.create({
        users: [friendRequest.from, friendRequest.to],
        unread: [friendRequest.to],
    });
    // add the conversation to the users' conversations array
    await user_model_1.default.updateOne({ _id: friendRequest.from }, { $push: { conversations: conversation._id } });
    await user_model_1.default.updateOne({ _id: friendRequest.to }, { $push: { conversations: conversation._id } });
    // Step 8: Return Success Message
    return {
        message: "Friend request sent successfully",
        friendRequest: friendRequestData,
    };
};
exports.sendFriendRequestService = sendFriendRequestService;
/**
 * Service to handle accetping or rejecting a friend request.
 * @param userId - User ID.
 * @param friendRequestId - Friend request ID.
 * @param action - Action to be performed (accept/reject).
 * @returns Message indicating the result of the operation.
 */
const handleFriendRequestResponseService = async (userId, friendRequestId, action) => {
    // Step 1: Verify the friend request exists and is intended for the user
    const friendRequest = await friendRequest_model_1.default.findById({
        _id: friendRequestId,
    });
    if (!friendRequest || !(friendRequest.to.toString() === userId)) {
        throw new Error(ERR_INVITATION_NOT_FOUND);
    }
    // step2: update the status of the friend request
    let updatedStatus;
    if (action === "accept") {
        updatedStatus = FriendRequestStatus.ACCEPTED;
    }
    else if (action === "reject") {
        updatedStatus = FriendRequestStatus.REJECTED;
    }
    else {
        throw new Error(ERR_INVALID_ACTION);
    }
    // save the updated status
    friendRequest.status = updatedStatus;
    await friendRequest.save();
    // // create a conversation between the two users
    // if (updatedStatus === FriendRequestStatus.ACCEPTED) {
    //   const conversation = await Conversation.create({
    //     users: [friendRequest.from, friendRequest.to],
    //     unread: [friendRequest.to],
    //   });
    //   // add the conversation to the users' conversations array
    //   await User.updateOne(
    //     { _id: friendRequest.from },
    //     { $push: { conversations: conversation._id } }
    //   );
    //   await User.updateOne(
    //     { _id: friendRequest.to },
    //     { $push: { conversations: conversation._id } }
    //   );
    // }
    // step3: remove the friend request from the user's friendRequests array
    await user_model_1.default.updateOne({ _id: friendRequest.from }, { $pull: { friendRequests: friendRequestId } });
    await user_model_1.default.updateOne({ _id: friendRequest.to }, { $pull: { friendRequests: friendRequestId } });
    // step4: if accepted, add the users to each other's friends array
    if (updatedStatus === FriendRequestStatus.ACCEPTED) {
        await user_model_1.default.updateOne({ _id: friendRequest.from }, { $push: { friends: friendRequest.to } });
        await user_model_1.default.updateOne({ _id: friendRequest.to }, { $push: { friends: friendRequest.from } });
    }
    // get the user data from and to
    let fromUser = await user_model_1.default.findById(friendRequest.from);
    const toUser = await user_model_1.default.findById(friendRequest.to);
    // step5: return a message indicating the result of the operation
    return {
        message: `Friend request ${action}ed successfully`,
        from: fromUser,
        to: toUser,
    };
};
exports.handleFriendRequestResponseService = handleFriendRequestResponseService;
/**
 * Service to get a user's friend requests.
 * @param userId - User ID.
 * @returns Array of friend requests.
 */
const getFriendRequestsService = async (userId) => {
    // Step 1: Find All Friend Requests
    const friendRequests = await friendRequest_model_1.default
        .find({
        $or: [{ from: userId }, { to: userId }],
    })
        .populate("from")
        .populate("to")
        .exec();
    if (!friendRequests) {
        throw new Error(ERR_INVITATION_NOT_FOUND);
    }
    // Step 2: Return Friend Requests
    return friendRequests;
};
exports.getFriendRequestsService = getFriendRequestsService;
