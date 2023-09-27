const passport = require("passport");
const dotenv = require("dotenv");
dotenv.config();
const User = require("../src/models/user-model");

import {
  Strategy as JwtStrategy,
  ExtractJwt,
  StrategyOptions,
  VerifiedCallback,
} from "passport-jwt";

// import { VerifyCallback } from "passport-google-oauth20";

// const GoogleOauthStrategy = require("passport-google-oauth20").Strategy;

passport.serializeUser((user: any, done: any) => {
  return done(null, user.userId);
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
          return done(null, jwt_payload);
        } else {
          return done(null, false);
        }
      } catch (err: any) {
        return done(err, false);
      }
    }
  )
);

// const googleOptions = {
//   clientID: process.env.GOOGLE_CLIENT_ID,
//   clientSecret: process.env.GOOGLE_CLIENT_SECRET,
//   callbackURL: process.env.CALLBACK_URL,
//   scope: ["profile", "email"],
// };

// passport.use(
//   new GoogleOauthStrategy(
//     googleOptions,
//     async (
//       _accessToken: any,
//       _refreshToken: any,
//       profile: any,
//       done: VerifyCallback
//     ) => {
//       try {
//         let user = await User.findOne({
//           googleId: profile.id,
//         });

//         if (!user) {
//           user = await User.create({
//             googleId: profile.id,
//             userName: profile.displayName,
//             email: profile.emails[0]?.value,
//           });
//         }

//         if (user) {
//           return done(null, user);
//         } else {
//           return done(null, false);
//         }
//       } catch (err: any) {
//         return done(err, false);
//       }
//     }
//   )
// );

export {};
module.exports = passport;
