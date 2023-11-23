// classes from mongoose
import { Schema, model } from "mongoose";

// groupConversatoin Interface
interface IgroupConversation {
  name: String;
  createdBy: Schema.Types.ObjectId;
  profilePic: {
    url: String;
    public_Id: String;
  };
  defaultLanguages: String[];
}

// groupConversatoin schema
const GroupConversationSchema = new Schema<IgroupConversation>(
  {
    name: String,
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    profilePic: {
      url: String,
      public_Id: String,
    },
    defaultLanguages: [String],
  },
  { timestamps: true }
);

const GroupConversation = model<IgroupConversation>(
  "GroupConversations",
  GroupConversationSchema
);

export {};
module.exports = GroupConversation;
