// classes from mongoose
import { Schema, model } from "mongoose";

// groupMessage Interface
interface IgroupMessage {
  messagesArray: [{ message: String; language: String }];
  createdBy: Schema.Types.ObjectId;
  conversation: Schema.Types.ObjectId;
}

// groupMessage schema
const groupMessageSchema = new Schema<IgroupMessage>(
  {
    messagesArray: [{ message: String, language: String }],
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    conversation: Schema.Types.ObjectId,
  },
  { timestamps: true }
);

const GroupMessage = model<IgroupMessage>("GroupMessages", groupMessageSchema);

export {};
module.exports = GroupMessage;
