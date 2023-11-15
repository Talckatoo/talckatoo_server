import mongoose, { Document, Schema } from "mongoose";

// friendRequest Interface
export interface IFriendRequest extends Document {
  from: Schema.Types.ObjectId;
  to: Schema.Types.ObjectId;
  status: String;
}

// friendRequest schema
const friendRequestSchema = new Schema<IFriendRequest>(
  {
    from: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Please provide a sender"],
    },
    to: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Please provide a receiver"],
    },
    status: {
      type: String,
      enum: ["pending", "accepted", "rejected"],
      default: "pending",
    },
  },
  { timestamps: true }
);

export default mongoose.model<IFriendRequest>(
  "FriendRequest",
  friendRequestSchema
);
