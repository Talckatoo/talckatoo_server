// classes from mongoose
import { Schema, model } from "mongoose";

//import jwt to create tokens for user
const jwt = require("jsonwebtoken");

// check to see if email is in its valid format
const validator = require("validator");

//for encrypting user password
const bcrypt = require("bcryptjs");

//user Interface
interface Iuser {
  userName: String;
  email: String;
  password: String;
  googleId: String;
  conversations: Array<String>;
  profileImage?: { public_id: String; url: String };
  language: String;
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
    minlength: 5,
  },
  googleId: {
    type: String,
  },
  conversations: [
    {
      type: Schema.Types.ObjectId,
      ref: "Conversation",
    },
  ],
  profileImage: {
    public_id: String,
    url: String,
  },
  language: {
    type: String,
  },
});

UserSchema.pre("save", async function (next) {
  if (!this.isModified("password")) next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

UserSchema.methods.createJWT = function () {
  return jwt.sign(
    { userId: this._id, userName: this.userName, email: this.email },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRES_IN,
    }
  );
};

UserSchema.methods.comparePassword = async function (userPassword: any) {
  const isMatch = await bcrypt.compare(userPassword, this.password);
  return isMatch;
};

const User = model<Iuser>("User", UserSchema);
export {};
module.exports = User;
