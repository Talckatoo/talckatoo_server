// classes from mongoose
import { Schema, model } from "mongoose";

// message Interface
interface Imedia {
  type: MediaType;
  url: String;
  altText: String;
}

export type MediaType = "pdf" | "image" | "audio";

const mediaSchema = new Schema<Imedia>(
  {
    type: {
      type: String,
      enum: ["pdf", "image", "audio"],
    },
    url: {
      type: String,
    },
    altText: {
      type: String,
    },
  },
  { timestamps: true }
);

const Media = model<Imedia>("Media", mediaSchema);

export {};
module.exports = Media;
