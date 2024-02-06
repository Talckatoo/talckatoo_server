// classes from mongoose
import { Schema, model } from "mongoose";

// message Interface
interface Iconversation {
  user1: { userName: String; url: String; language: String };
  user2: { userName: String; url: String; language: String };
}

// conversation schema
const conversationSchema = new Schema<Iconversation>(
  {
    user1: {
      userName: String,
      url: String,
      language: String,
      socketId: String,
    },
    user2: { userName: String, url: String, language: String },
  },
  { timestamps: true }
);

const Conversation = model<Iconversation>(
  "RandomConversation",
  conversationSchema
);

export {};
module.exports = Conversation;
