"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const passport = require("passport");
const dotenv = require("dotenv");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
dotenv.config();
const User = require("../src/models/user-model");
const passport_jwt_1 = require("passport-jwt");
const jwtOptions = {
    jwtFromRequest: passport_jwt_1.ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: process.env.JWT_SECRET,
};
passport.use(new passport_jwt_1.Strategy(jwtOptions, async (jwt_payload, done) => {
    try {
        const user = await User.findOne({ _id: jwt_payload.userId });
        if (user) {
            return done(null, jwt_payload);
        }
        else {
            return done(null, false);
        }
    }
    catch (err) {
        return done(err, false);
    }
}));
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL,
    scope: ["profile", "email"],
}, async (_accessToken, _refreshToken, profile, done) => {
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
            language: profile._json.locale,
            welcome: "hello",
            profileImage: {
                url: profile.photos[0].value,
            },
        });
        return done(null, newUser);
    }
    catch (error) {
        return done(error, null);
    }
}));
passport.serializeUser((user, done) => {
    return done(null, user.userId);
});
passport.deserializeUser(async (id, done) => {
    try {
        const user = await User.findOne({ _id: id });
        if (user) {
            return done(null, user);
        }
        else {
            return done(null, false);
        }
    }
    catch (err) {
        return done(err, false);
    }
});
module.exports = passport;
