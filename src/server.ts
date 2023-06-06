const mongoose = require("mongoose");
const dotenv = require("dotenv");
const app = require("./app.ts");
const socket = require("socket.io");
import { Socket } from "socket.io";
const { Types } = require("mongoose");


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
    origin: "http://localhost:3000",
    credentials: true,
  },
});

const onlineUsers = new Map<string, string>();

io.on("connection", (socket: Socket) => {
  const chatSocket = socket;
  console.log('we should have a connection');

  socket.on("add-user", (data) => {
    const { toUserId} = data;
    onlineUsers.set(toUserId, socket.id);
    console.log(`the event userId should be ${toUserId}`);
    console.log(`the socket id should be ${socket.id}`);
    console.log(`the onlineUsers are ${JSON.stringify(Array.from(onlineUsers))}`);
  });

  socket.on("send-msg", (data) => {
    const {to, msg} = data;
    const sendUserSocket = onlineUsers.get(to);
    if (sendUserSocket) {
      console.log(`Confirming that to is ${to} and the message is ${msg}. The sendUserSocket variable says ${sendUserSocket} `);
      socket.to(sendUserSocket).emit("msg-receive", msg);
    }
  });

  socket.on("disconnect", () => {
    // Remove the disconnected socket from onlineUsers map
    for (const [userId, socketId] of onlineUsers) {
      console.log('this is getting activated')
      if (socketId === socket.id) {
        console.log(`deleting data from socket ${socketId}`)
        onlineUsers.delete(userId);
        break;
      }
    }
    console.log(`Socket disconnected: ${socket.id}`);
    console.log(`Updated onlineUsers: ${JSON.stringify(Array.from(onlineUsers))}`);
  })
});
