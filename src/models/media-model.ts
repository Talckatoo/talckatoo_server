// classes from mongoose
import { Schema, model } from "mongoose";

// message Interface
interface Imedia {
  type: string;
  url: String;
  altText: String;
}

const mediaSchema = new Schema<Imedia>(
  {
    type: {
      type: String,
      required: [true, "type is required"],
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
