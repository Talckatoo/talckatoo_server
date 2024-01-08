const passport = require("passport");
const dotenv = require("dotenv");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
dotenv.config();
const User = require("../src/models/user-model");

import {
  Strategy as JwtStrategy,
  ExtractJwt,
  StrategyOptions,
  VerifiedCallback,
} from "passport-jwt";

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

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
    },
    async (_accessToken: any, _refreshToken: any, profile: { id: any; displayName: any; emails: { value: any; }[]; }, done: (arg0: unknown, arg1: null) => any) => {
      try {
        // Check if user already exists in the database
        const existingUser = await User.findOne({ googleId: profile.id });

        if (existingUser) {
          return done(null, existingUser);
        }

        // Create a new user with Google profile information
        const newUser = await User.create({
          userName: profile.displayName,
          email: profile.emails[0].value,
          googleId: profile.id,
          // Add other necessary fields as needed
        });

        return done(null, newUser);
      } catch (error) {
        return done(error, null);
      }
    }
  )
);

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

module.exports = passport;
export { };
module.exports = passport;
