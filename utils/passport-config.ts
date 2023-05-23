const passport = require("passport");
const dotenv = require("dotenv");
dotenv.config({ path: "./config.env" });
const User = require("../src/models/user-model");

import {
  Strategy as JwtStrategy,
  ExtractJwt,
  StrategyOptions,
  VerifiedCallback,
} from "passport-jwt";

passport.serializeUser((user: any, done: any) => {
  return done(null, user._id);
});

passport.deserializeUser(async (id: any, done: any) => {
  try {
    const user = await User.findOne({ _id: id });
    if (user) {
      return done(null, user);
    } else {
      return done(null, false);
    }
  } catch (err: any) {
    return done(err, false);
  }
});

const jwtOptions: StrategyOptions = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: process.env.JWT_SECRET,
};

passport.use(
  new JwtStrategy(
    jwtOptions,
    async (jwt_payload: any, done: VerifiedCallback) => {
      try {
        const user = await User.findOne({ _id: jwt_payload.userId });

        if (user) {
          return done(null, user);
        } else {
          return done(null, false);
        }
      } catch (err: any) {
        return done(err, false);
      }
    }
  )
);

export {};
module.exports = passport;
