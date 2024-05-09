// classes from mongoose
import { Schema, model } from "mongoose";

//import jwt to create tokens for user
const jwt = require("jsonwebtoken");

// check to see if email is in its valid format
const validator = require("validator");

//for encrypting user password
const bcrypt = require("bcryptjs");

const crypto = require("crypto");

//user Interface
export interface Iuser {
  userName: String;
  email: String;
  password: String;
  phoneNumber?: String;
  googleId: String;
  conversations: Array<String>;
  profileImage?: { public_id: String; url: String };
  language: String;
  welcome: String;
  groups: [Schema.Types.ObjectId];
  friendRequests: Array<String>;
  friends: Array<String>;
  passwordResetToken: String;
  passwordResetTokenExpires: Date;
  dateBirth: String;
  profile?: String;
  deleted: Boolean;
}

//user schema
const UserSchema = new Schema<Iuser>({
  userName: {
    type: String,
    unique: true,
    required: [true, "please enter a username"],
    minLength: 5,
  },
  email: {
    type: String,
    required: [true, "please enter an email address"],
    unique: true,
    validate: [validator.isEmail, "please enter a valid email address"],
  },
  phoneNumber: {
    type: String,
    minlength: 10,
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
  welcome: {
    type: String,
  },
  groups: [{ type: Schema.Types.ObjectId, ref: "GroupConversations" }],
  friendRequests: [
    {
      type: Schema.Types.ObjectId,
      ref: "FriendRequest",
    },
  ],
  friends: [
    {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  ],
  passwordResetToken: String,
  passwordResetTokenExpires: Date,
  dateBirth: {
    type: Date,
  },
  profile: {
    type: Schema.Types.ObjectId,
    ref: "Profile",
    required: false,
  },
  deleted: {
    type: Boolean,
    default: false,
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

UserSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString("hex");

  this.passwordResetToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");
  this.passwordResetTokenExpires = Date.now() + 10 * 60 * 1000;
  return resetToken;
};

export const User = model<Iuser>("User", UserSchema);
export {};
module.exports = User;

export default User;
