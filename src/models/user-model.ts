// classes from mongoose
import { Schema, model } from "mongoose";

// check to see if email is in its valid format
const validator = require("validator");

//for encrypting user password
const bcrypt = require("bcryptjs");

//user Interface
interface Iuser {
  userName: String;
  email: String;
  password: String;
}

//user schema
const UserSchema = new Schema<Iuser>({
  userName: {
    type: String,
    unique: true,
    required: true,
    minLength: 5,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    validate: [validator.isEmail, "please enter a valid email address"],
  },
  password: {
    type: String,
    required: true,
    minlength: 5,
  },
});

UserSchema.pre("save", async function (next) {
  if (!this.isModified("password")) next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

const User = model<Iuser>("User", UserSchema);
export {};
module.exports = User;
