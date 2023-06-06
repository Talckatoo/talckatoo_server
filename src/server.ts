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
  socket.on("add-user", (userId) => {
    onlineUsers.set(userId, socket.id);
  });

  socket.on("send-msg", (data) => {
    const sendUserSocket = onlineUsers.get(data.to);
    if (sendUserSocket) {
      socket.to(sendUserSocket).emit("msg-recieve", data.msg);
    }
  });
});
