// classes from mongoose
import { Schema, model } from "mongoose";

// message Interface
interface Imessage {
  message: String;
  sender: String;
  voiceNote?: {
    public_id: String;
    url: String;
  };
  media?: String;
  status: Boolean;
}

// message schema
const messageSchema = new Schema<Imessage>(
  {
    message: {
      type: String,
      minlength: 1,
      maxlength: 2000,
    },
    sender: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    voiceNote: {
      public_id: String,
      url: String,
    },
    media: {
      type: Schema.Types.ObjectId,
      ref: "Media",
      required: false,
    },
    status: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

const Message = model<Imessage>("Message", messageSchema);

export {};
module.exports = Message;
