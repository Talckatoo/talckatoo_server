// classes from mongoose
import { Schema, model } from "mongoose";

// message Interface
interface Iconversation {
  messages: Array<String>;
  users: Array<String>;
  unread: Array<String>;
}

// conversation schema
const conversationSchema = new Schema<Iconversation>(
  {
    messages: [
      {
        type: Schema.Types.ObjectId,
        ref: "Message",
      },
    ],
    users: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    unread: [
      {
        type: String, // recipientID
      },
    ],
  },
  { timestamps: true }
);

const Conversation = model<Iconversation>("Conversation", conversationSchema);

export {};
module.exports = Conversation;
