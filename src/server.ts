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
    origin: "http://localhost:5173",
    credentials: true,
  },
});

const onlineUsers = new Map<string, string>();

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
