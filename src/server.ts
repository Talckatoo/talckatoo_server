const mongoose = require("mongoose");
const dotenv = require("dotenv");
const app = require("./app.ts");
const socket = require("socket.io");
const AppError = require("../utils/custom-error");
const User = require("../src/models/user-model");
const Message = require("../src/models/message-model");
const Conversation = require("../src/models/conversation-model");
const openAi = require("../utils/openai_config");
import { Socket } from "socket.io";

dotenv.config({ path: "./config.env" });

const DB = process?.env?.DATABASE?.replace(
  "<password>",
  `${process.env.DATABASE_PASSWORD}`
);

mongoose.set("strictQuery", true);

const listener = async () => {
  await mongoose
    .connect(DB, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    })
    .then(() => console.log("database connection successful"));
  console.log(`Listening on Port ${PORT}!`);
};
const { PORT = 8000 } = process.env;
const server = app.listen(PORT, listener);

const io = socket(server, {
  cors: {
    origin: "http://localhost:5173",
    credentials: true,
  },
});

const onlineUsers: any = new Map<string, string>();

io.on("connection", (socket: Socket) => {
  console.log("we should have a connection");

  socket.on("addUser", (userId) => {
    onlineUsers.set(userId, socket.id);
    console.log("the online users are", Array.from(onlineUsers));
    io.emit("getUsers", Array.from(onlineUsers));
  });

  socket.on("sendMessage", (data) => {
    const sendUserSocket = onlineUsers.get(data.to);
    if (sendUserSocket) {
      socket.to(sendUserSocket).emit("getMessage", data);
    }
  });

  socket.on("isTyping", (data) => {
    const sendUserSocket = onlineUsers.get(data.to);
    if (sendUserSocket) {
      socket.to(sendUserSocket).emit("isTyping", data);
    }
  });
  socket.on("isTyping", (data) => {
    const sendUserSocket = onlineUsers.get(data.to);
    if (sendUserSocket) {
      socket.to(sendUserSocket).emit("isTyping", data);
    }
  });
  socket.on("isTyping", (data) => {
    const sendUserSocket = onlineUsers.get(data.to);
    if (sendUserSocket) {
      socket.to(sendUserSocket).emit("isTyping", data);
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
    const response = await openAi(text);
    const reply = response.data.choices[0].message.content;
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
});
