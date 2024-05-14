"use strict";
var __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
Object.defineProperty(exports, "__esModule", { value: true });
exports.getFriends = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const multiparty = require("multiparty");
const User = require("../models/user-model");
const Message = require("../models/message-model");
const Conversation = require("../models/conversation-model");
const catchAsync = require("../../utils/catch-async");
const AppError = require("../../utils/custom-error");
const cloudinary = require("../../utils/cloudinary");
const axios = require("axios");
const translator_api_1 = __importDefault(require("../../utils/translator-api"));
exports.getUsers = catchAsync(async (req, res, next) => {
  const { userId } = req.user;
  const currentUser = await User.findOne({ _id: userId });
  const populateOptions = {
    path: "conversations",
    select: "_id createdAt updatedAt unread",
  };
  const contactedUsers = await User.find({
    _id: { $ne: currentUser._id },
    conversations: { $in: currentUser.conversations },
  })
    .select("_id userName conversations profileImage language")
    .populate(populateOptions);
  contactedUsers.forEach((user) => {
    user.conversations = user.conversations.filter((conversation) => {
      return currentUser.conversations.includes(conversation._id);
    });
  });
  const modifiedUsers = contactedUsers.map((user) => {
    return {
      _id: user._id,
      userName: user.userName,
      profileImage: user.profileImage,
      conversation: user.conversations[0],
      conversations: undefined,
      language: user.language,
    };
  });
  modifiedUsers.sort((a, b) => {
    if (
      a.conversation["updatedAt"].getTime() <
      b.conversation["updatedAt"].getTime()
    ) {
      return 1;
    }
    if (
      a.conversation["updatedAt"].getTime() >
      b.conversation["updatedAt"].getTime()
    ) {
      return -1;
    }
    return 0;
  });
  const uncontactedUsers = await User.find({
    _id: { $ne: currentUser._id },
    conversations: { $nin: currentUser.conversations },
  }).select("_id userName profileImage language");
  if (contactedUsers.length < 1 && uncontactedUsers.length < 1) {
    res
      .status(200)
      .json({ status: "Success", message: "There are currently no users" });
  }
  res.status(200).json({
    status: "Success",
    users: { contactedUsers: modifiedUsers, uncontactedUsers },
  });
});
/**
 * Controller to get all friends of a user.
 * @param req - Request object.
 * @param res - Response object.
 */
const getFriends = async (req, res, next) => {
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
    // GET THE CURRENT USER
    const currentUser = await User.findById(userId);
    const friends = await User.findById(userId)
      .select("friends")
      .populate("friends");
    let contactedUsers = [];
    let uncontactedUsers = [];
    let latestMessage;
    let last;
    for (const friend of friends.friends) {
      // Check if there's a shared conversation ID
      const sharedConversation = friend.conversations.find((conversationId) =>
        currentUser.conversations.includes(conversationId)
      );
      const populateOptions = {
        path: "messages",
        select: "_id createdAt updatedAt message voiceNote",
      };
      // get the conversation object
      let conversation = sharedConversation
        ? await Conversation.findById(sharedConversation).populate(
            populateOptions
          )
        : null;

      if (conversation) {
        last = conversation.messages.pop();
        if (last.message && last) {
          latestMessage = last.message;
        } else if (last.voiceNote) {
          latestMessage = "voiceNote";
        }
      }
      conversation = {
        _id: conversation?._id,
        createdAt: conversation?.createdAt,
        updatedAt: conversation?.updatedAt,
        unread: conversation?.unread,
        users: conversation?.users,
      };
      if (sharedConversation) {
        contactedUsers.push({
          _id: friend._id,
          userName: friend.userName,
          conversation: conversation,
          profileImage: friend.profileImage,
          language: friend.language,
          latestMessage: latestMessage ? latestMessage : null,
        });
      } else {
        uncontactedUsers.push({
          _id: friend._id,
          userName: friend.userName,
          profileImage: friend.profileImage,
          language: friend.language,
        });
      }
    }
    res.status(200).json({
      status: "Success",
      users: {
        contactedUsers,
        uncontactedUsers,
      },
    });
  } catch (error) {
    next(error);
  }
};
exports.getFriends = getFriends;
exports.getUser = catchAsync(async (req, res, next) => {
  const { userId } = req.params;
  const user = await User.findOne({ _id: userId });
  if (!user) {
    throw new AppError("This user does not exist", 404);
  }
  res.status(200).json({ status: "Success", user });
});
exports.getUserConversations = catchAsync(async (req, res, next) => {
  const { userId } = req.params;
  const populateOptions = [
    { path: "users", select: "userName _id profileImage language" },
  ];
  const conversations = await Conversation.find({ users: userId }).populate(
    populateOptions
  );
  if (conversations.length < 1) {
    res
      .status(200)
      .json({ status: "Success", message: "This user has no conversations" });
  }
  res.status(200).json({ status: "Success", conversations });
});
exports.getUserConversation = catchAsync(async (req, res, next) => {
  const { conversationId } = req.params;
  const { page, limit, fromDate, toDate } = req.query;
  const queryParams = {
    page: page ? parseInt(page, 10) : 1,
    limit: limit ? parseInt(limit, 10) : 10,
    fromDate: fromDate,
    toDate: toDate,
  };
  const populateOptions = [
    { path: "users", select: "userName profileImage language" },
    {
      path: "messages",
      select: "message sender createdAt voiceNote status media",
      populate: {
        path: "media",
        select: "url altText type",
      },
    },
  ];
  const conversation = await Conversation.findOne({
    _id: conversationId,
  }).populate(populateOptions);
  if (!conversation) {
    throw new AppError("This conversation does not exist", 404);
  }
  let messages = conversation.messages;
  if (queryParams.fromDate && queryParams.toDate) {
    const fromDateObj = new Date(queryParams.fromDate);
    const toDateObj = new Date(queryParams.toDate);
    messages = messages.filter((message) => {
      const messageDate = new Date(message.createdAt);
      return messageDate >= fromDateObj && messageDate <= toDateObj;
    });
  }
  // reverse the messages array so that the latest messages are at the top
  messages.reverse();
  const startIndex = ((queryParams.page || 1) - 1) * (queryParams.limit || 10);
  const endIndex = (queryParams.page || 1) * (queryParams.limit || 10);
  const paginatedMessages = messages.slice(startIndex, endIndex).reverse();
  res.status(200).json({
    status: "Success",
    conversation: {
      ...conversation.toObject(),
      messages: paginatedMessages,
    },
  });
});
exports.updateProfile = catchAsync(async (req, res, next) => {
  const { userId } = req.params;
  const { userName, fileUrl, language } = req.body;
  let updateObj = {
    profileImage: { public_id: fileUrl, url: fileUrl },
  };
  if (!updateObj.profileImage.public_id) updateObj = {};
  if (userName) updateObj.userName = userName;
  if (language) {
    const response = await (0, translator_api_1.default)(
      language,
      "welcome",
      process.env.AZURE_TRANSLATOR_KEY,
      process.env.TRANSLATOR_ENDPOINT
    );
    const welcome = response[0]?.text;
    updateObj.language = language;
    updateObj.welcome = welcome;
  }
  const user = await User.findOneAndUpdate({ _id: userId }, updateObj, {
    new: true,
  });
  if (!user) {
    return next(new AppError("No user found with the provided Id", 404));
  }
  res.status(200).json({
    success: "true",
    user,
  });
});
exports.editUserConversation = catchAsync(async (req, res, next) => {
  const { conversationId, userId } = req.params;
  const populateOptions = [
    { path: "users", select: "userName profileImage language" },
    { path: "messages", select: "message sender createdAt voiceNote status" },
  ];
  let conversation = await Conversation.findOneAndUpdate(
    { _id: conversationId },
    {
      $pull: { unread: userId },
    },
    { new: true }
  ).populate(populateOptions);
  if (!conversation) {
    throw new AppError("This conversation does not exist", 404);
  }
  res.status(200).json({ status: "Success", conversation });
});
