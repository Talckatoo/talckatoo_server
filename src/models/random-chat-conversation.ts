// classes from mongoose
import { Schema, model } from "mongoose";

// message Interface
interface Iconversation {
  user1: {
    userName: String;
    profilePicture: String;
    language: String;
    id: String;
    email: String;
  };
  user2: {
    userName: String;
    profilePicture: String;
    language: String;
    id: String;
    email: String;
  };
}

// conversation schema
const conversationSchema = new Schema<Iconversation>(
  {
    user1: {
      userName: String,
      profilePicture: String,
      language: String,
      id: String,
      email: String,
    },
    user2: {
      userName: String,
      profilePicture: String,
      language: String,
      id: String,
      email: String,
    },
  },
  { timestamps: true }
);

const Conversation = model<Iconversation>(
  "RandomConversation",
  conversationSchema
);

export {};
module.exports = Conversation;
