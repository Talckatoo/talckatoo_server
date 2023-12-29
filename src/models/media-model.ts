// classes from mongoose
import { Schema, model } from "mongoose";

// message Interface
interface Imedia {
  type: MediaType;
  url: String;
  altText: String;
}

export type MediaType = "pdf" | "image" | "audio" | "video";

const mediaSchema = new Schema<Imedia>(
  {
    type: {
      type: String,
      enum: ["pdf", "image", "audio", "video"],
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

export default Media;
