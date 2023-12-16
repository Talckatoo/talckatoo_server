import { Schema, model } from "mongoose";

interface Iprofile {
  firstName: String;
  lastName: String;
  country: String;
}

const profileSchema = new Schema<Iprofile>(
  {
    firstName: {
      type: String,
      minlength: 3,
    },
    lastName: {
      type: String,
      minlength: 3,
    },
    country: {
      type: String,
    },
  },
  { timestamps: true }
);

const Profile = model<Iprofile>("Profile", profileSchema);

export {};
module.exports = Profile;
