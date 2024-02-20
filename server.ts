import { Request, Response, NextFunction } from "express";

import { Socket } from "socket.io";
import { isPromise } from "util/types";
import getTranslation from "./utils/translator-api";

const mongoose = require("mongoose");
const dotenv = require("dotenv");
const app = require("./app");
const socket = require("socket.io");
const AppError = require("./utils/custom-error");
const User = require("./src/models/user-model");
const Message = require("./src/models/message-model");
const Conversation = require("./src/models/conversation-model");
const openAi = require("./utils/openai_config");
const catchAsync = require("./utils/catch-async");
const GroupConversation = require("./src/models/group-conversation-model");
const GroupMessages = require("./src/models/group-message-model");
const RandomConversations = require("./src/models/random-chat-conversation");
const axios = require("axios");
dotenv.config();

const DB = process?.env?.DATABASE?.replace(
  "<password>",
  `${process.env.DATABASE_PASSWORD}`
);

mongoose.set("strictQuery", true);

const listener = async () => {
  await mongoose.connect(DB, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  console.log("connected to server");
};

const { PORT = 8000 } = process.env;
const server = app.listen(PORT || "8000", listener);

const io = socket(server, {
  cors: {
    origin: "*",
  },
});

//const onlineUsers: any = new Map<string, string>();
//const onlineUsers: Map<string, string> = new Map();
//const onlineUsers: Map<string, string> = new Map;
//const onlineUsers = new Map<string, string>();
//const onlineUsers: Map<string, string> = new Map<string, string>();

const onlineUsers = new Map();

io.on("connection", (socket: Socket) => {
  socket.on("addUser", (userId: any) => {
    onlineUsers.set(userId, socket.id);
    io.emit("getUsers", Array.from(onlineUsers));
  });

  socket.on("joinRoom", (conversation: any) => {
    socket.join(conversation);
  });

  socket.on(
    "sendGroupMessage",
    async ({ conversationId, userId, message: text }) => {
      const conversation = await GroupConversation.findOne({
        _id: conversationId,
      });
      if (!conversation)
        throw new AppError("no group conversation found for that id", 404);

      const messagesArray = conversation?.defaultLanguages?.map(
        async (language: string) => {
          const options = {
            method: "POST",
            url: process.env.TRANSLATE_URL,
            headers: {
              "content-type": "application/json",
              "X-RapidAPI-Key": process.env.TRANSLATE_API_KEY,
              "X-RapidAPI-Host": process.env.API_HOST,
            },
            data: {
              text,
              target: language,
            },
          };
          const response = await axios.request(options);
          return { message: response.data[0].result.text, language };
        }
      );

      const translatedMessages = await Promise.all(messagesArray);

      const message = await GroupMessages.create({
        createdBy: userId,
        messagesArray: translatedMessages,
        conversation,
      });

      io.to(conversation).emit("groupMessage", message);
    }
  );

  socket.on("sendMessage", (data: any) => {
    const sendUserSocket = onlineUsers.get(data.to);
    if (sendUserSocket) {
      io.to(sendUserSocket).emit("getMessage", data);
    }
  });

  socket.on("joinRandomChat", async (data: any) => {
    try {
      const { userName, profilePicture, language, id, email } = data;

      // Prevent self-matching
      if (id === socket.id) {
        console.log("User cannot match with themselves.");
        return;
      }

      // Find an existing conversation where user2 is null
      let existingConversation = await RandomConversations.findOneAndUpdate(
        { user2: null },
        {
          user2: {
            userName,
            profilePicture,
            language,
            id,
            email,
            socketId: socket.id,
          },
        },
        { new: true }
      );

      // If the user is already in a random chat, delete the existing conversation and create a new one
      if (existingConversation?.user1._id === id) {
        await RandomConversations.deleteOne({ _id: existingConversation._id });
        const newConversation = await RandomConversations.create({
          user1: {
            userName,
            profilePicture,
            language,
            socketId: socket.id,
            id,
            email,
          },
        });

        io.to(socket.id).emit("randomResult", newConversation);
        return;
      }

      if (!existingConversation) {
        // Create a new random conversation if none exists
        const newConversation = await RandomConversations.create({
          user1: {
            userName,
            profilePicture,
            language,
            socketId: socket.id,
            id,
            email,
          },
        });

        io.to(socket.id).emit("randomResult", newConversation);
      } else {
        // Emit event to the user who joined the random chat
        io.to(socket.id).emit("randomResult", existingConversation);
        io.to(existingConversation.user1.socketId).emit(
          "randomResult",
          existingConversation
        );

        // Delete the existing conversation
        await RandomConversations.deleteOne({ _id: existingConversation._id });
      }
    } catch (error) {
      console.error("Error joining random chat:", error);
    }
  });

  socket.on("sendRandomMessage", async (data) => {
    if (data.message) {
      const text = data.message;
      const target = data.language;

      const response: any = await getTranslation(
        target,
        text,
        process.env.AZURE_TRANSLATOR_KEY,
        process.env.TRANSLATOR_ENDPOINT
      );

      const translate = `\n${response[0]?.text}`;

      io.to(data.socketId).emit("getRandomMessage", {
        ...data,
        message: text + translate,
      });
      io.to(socket.id).emit("getRandomMessage", {
        ...data,
        message: text + translate,
      });
    } else {
      io.to(data.socketId).emit("getRandomMessage", data);
      io.to(socket.id).emit("getRandomMessage", data);
    }
  });

  socket.on("leaveRandomChat", async (data: any) => {
    const user1 = data?.randomData?.user1;
    const user2 = data?.randomData?.user2;
    if (user1 && user2) {
      io.to(user1.socketId).emit("leaveRandomChat", { message: "Leave call!" });
      io.to(user2.socketId).emit("leaveRandomChat", { message: "Leave call!" });
      return;
    }

    try {
      const { conversationId, socketId } = data;

      if (!conversationId) {
        return;
      }
      const conversation = await RandomConversations.findOne({
        _id: conversationId,
      });

      if (conversation) {
        if (conversation.user1.socketId === socketId) {
          await RandomConversations.deleteOne({ _id: conversationId });
        } else {
          await RandomConversations.findOneAndUpdate(
            { _id: conversationId },
            { user2: null }
          );
        }
      }
    } catch (error) {
      console.error("Error leaving random chat:", error);
    }
  });

  socket.on("isTyping", (data: any) => {
    const sendUserSocket = onlineUsers.get(data.to);
    if (sendUserSocket) {
      io.to(sendUserSocket).emit("isTyping", data);
    }
  });

  socket.on("stopTyping", (data: any) => {
    const sendUserSocket = onlineUsers.get(data.to);
    if (sendUserSocket) {
      io.to(sendUserSocket).emit("stopTyping", data);
    }
  });

  socket.on("sendMessageChatGPT", async (data: any) => {
    const { message: text, from, to: toFront } = data;
    const to = toFront ? toFront : process.env.AI_ASSISTANT_ID;
    const sendUserSocket = toFront
      ? onlineUsers.get(from)
      : onlineUsers.get(to);

    if (!text || !to || !from) {
      throw new AppError("Invalid Input. Please try again", 400);
    }
    if (to === from) {
      throw new AppError("You can’t send a message to yourself", 403);
    }
    const selectUserSocket = onlineUsers.get(to);
    if (toFront) io.to(selectUserSocket).emit("getMessage", data);
    const message = await Message.create({
      message: text,
      sender: from,
    });
    let conversation = await Conversation.findOneAndUpdate(
      { users: { $all: [from, to] } },
      { $push: { messages: message.id } }
    );
    if (!conversation) {
      conversation = await Conversation.create({
        messages: [message.id],
        users: [from, to],
      });
      await User.findOneAndUpdate(
        { _id: from },
        { $push: { conversations: conversation.id } }
      );
      User.findOneAndUpdate(
        { _id: to },
        { $push: { conversations: conversation.id } }
      );
    }
    let response;
    try {
      response = await openAi(text);
    } catch (err) {}
    const reply = response?.data?.choices[0]?.message?.content;
    const messageReply = await Message.create({
      message: reply,
      sender: process.env.AI_ASSISTANT_ID,
    });
    if (toFront) {
      io.to(onlineUsers.get(to)).emit("getMessage", {
        messageReply,
        sender: "AI Assistant",
      });
      io.to(onlineUsers.get(from)).emit("getMessage", {
        messageReply,
        sender: "AI Assistant",
      });
    } else {
      io.to(sendUserSocket).emit("getMessage", { messageReply, sender: to });
    }
    await Conversation.findOneAndUpdate(
      { users: { $all: [from, to] } },
      { $push: { messages: messageReply.id } }
    );
  });

  socket.on("updateProfile", (data: any) => {
    const onlineFriends = data.onlineFriends;
    for (let i = 0; i < onlineFriends.length; i++) {
      let socketUserId = onlineUsers.get(onlineFriends[i]._id);
      io.to(socketUserId).emit("getUpdateProfile", data);
    }
  });

  socket.on("sendFriendRequest", (data: any) => {
    const sendUserSocket = onlineUsers.get(data.to);
    if (sendUserSocket) {
      io.to(sendUserSocket).emit("getFriendRequest", data);
    }
  });

  socket.on("acceptFriendRequest", (data: any) => {
    const sendUserSocket = onlineUsers.get(data.to);
    if (sendUserSocket) {
      io.to(sendUserSocket).emit("getAcceptFriendRequest", data);
    }
  });

  socket.on("disconnect", () => {
    // Remove the disconnected socket from onlineUsers map
    for (const [userId, socketId] of onlineUsers) {
      if (socketId === socket.id) {
        onlineUsers.delete(userId);
        break;
      }
    }
    io.emit("getUsers", Array.from(onlineUsers));
  });

  // setting up video call

  // 1. Get logged in user ID: pass the userID in socket and get it from onlineUsers

  socket.on("callUser", (data: any) => {
    const { userToCall, signalData, from, username, roomId } = data;
    // getting a room from the socket adapter
    // const { rooms } = io.sockets.adapter;
    // const room = rooms.get(roomId);

    socket.join(roomId);

    // Emit to the current socket
    // socket.emit('roomCreated', { message: 'Room created!' });

    // Emit to all sockets in the room
    io.to(roomId).emit("roomCreated", { message: "Room created!" });

    const sendUserSocket = onlineUsers.get(userToCall);
    io.to(sendUserSocket).emit("callUser", {
      signal: signalData,
      from,
      username,
      roomId,
      userToCall,
    });
  });

  socket.on("answerCall", (data) => {
    const { roomId } = data.callData;
    socket.join(roomId);
    io.to(roomId).emit("callAccepted", {
      signal: data.signal,
      call: data.callData,
    });

    // socket.broadcast.to(roomId).emit("callAccepted", data.signal)

    // io.to(sendUserSocket).emit("callAccepted", data.signal);
  });

  socket.on("leaveCall", (data) => {
    const { userToCall, signalData, from, username, roomId } = data;
    io.to(roomId).emit("leaveCall", { message: "Leave room!" });
  });

  // 2. Create a room for video call
  socket.on("join", (roomId) => {
    // getting a room from the socket adapter
    const { rooms } = io.sockets.adapter;
    const room = rooms.get(roomId);
    // Scenario 1 when there's no one in the room
    if (room === undefined) {
      socket.join(roomId);
      socket.emit("creates");
    }
    // Scenario 2 when 1 person is in the room
    else if (room.size == 1) {
      socket.join(roomId);
      socket.emit("joined");
    }
    // Scenario 3 when there already 2 users in the room
    else {
      socket.emit("full");
    }
  });
});
