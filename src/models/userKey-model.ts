// classes from mongoose
import { Schema, model } from "mongoose";

export interface IUserKey {
  userId: String;
  publicKey: String;
  privateKey: String;
}

const userKeySchema = new Schema<IUserKey>({
  userId: {
    type: String,
    ref: "User",
    required: true,
    unique: true,
  },
  publicKey: { type: String, required: true },
  privateKey: { type: String, required: true },
});

export const UserKey = model<IUserKey>("UserKey", userKeySchema);
