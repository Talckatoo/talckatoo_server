// types of the req, res and next...
import { Request, Response, NextFunction } from "express";
//
const express = require("express");
const app = express();
const cors = require("cors");
const favicon = require("express-favicon");
const logger = require("morgan");
const session = require("express-session");
const passport = require("../utils/passport-config");
const mainRouter = require("./routes/mainRouter");
const userRouter = require("./routes/user-router");
const { globalErrorHandler } = require("./../src/controllers/error-controller");

// middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(
  session({
    secret: process.env.JWT_SECRET,
    resave: true,
    saveUninitialized: true,
  })
);
app.use(logger("dev"));
app.use(express.static("public"));
app.use(favicon(__dirname + "/public/favicon.ico"));
app.use(passport.initialize());
app.use(passport.session());

// routes
app.use("/api/v1/users", userRouter);
app.use(
  "/api/v1/",
  passport.authenticate(["jwt", "google"], { scope: ["profile", "email"] }),
  mainRouter
);

// handle requests that do not exist on our server
app.all("*", (req: Request, res: Response, next: NextFunction) => {
  res.status(400).json({
    status: "not found",
    message: `can't find ${req.url} on this server`,
  });
});
app.use(globalErrorHandler);
export {};
module.exports = app;
