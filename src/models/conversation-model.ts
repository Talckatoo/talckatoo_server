// classes from mongoose
import { Schema, model } from "mongoose";

// message Interface
interface Iconversation {
  messages: Array<String>;
  users: Array<String>;
  unread: Array<String>;
  // latestMessage: String;
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
    // latestMessage: {
    //   type: String,
    // },
  },
  { timestamps: true }
);

// todo: handle encryption/decryption of messages
// through pre and post fetch for every converstaion

const Conversation = model<Iconversation>("Conversation", conversationSchema);

export {};
module.exports = Conversation;
