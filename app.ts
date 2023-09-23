// types of the req, res and next...
import { Request, Response, NextFunction } from "express";
import swaggerDocs from "./utils/swagger";
//
const express = require("express");
const app = express();
const cors = require("cors");
const favicon = require("express-favicon");
const logger = require("morgan");
const session = require("express-session");
const passport = require("./utils/passport-config");
const mainRouter = require("./src/routes/mainRouter");
const messageRouter = require("./src/routes/message-router");
const accountRouter = require("./src/routes/account-router");
const swaggerUi = require("swagger-ui-express");
const catchAsync = require("./utils/catch-async");

// const authRouter = require("./routes/auth-router");
const userRouter = require("./src/routes/user-router");
const { globalErrorHandler } = require("./src/controllers/error-controller");
const port: number = Number(process.env.PORT) || 8000;

// middleware
// app.use(cors({ origin: true }));

app.use((req: Request, res: Response, next: NextFunction) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, PATCH, DELETE"
  );
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});

app.use(express.json());
swaggerDocs(app, port);
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

app.get(
  "/",
  catchAsync(async (req: Request, res: Response) => {
    res.status(200).json({
      success: "Welcome to Talckatoo API",
    });
  })
);

app.use("/api/v1/account", accountRouter);

app.use(
  "/api/v1/users",
  passport.authenticate(["jwt"], { session: true }),
  userRouter
);

app.use(
  "/api/v1/",
  passport.authenticate(["jwt"], { session: true }),
  mainRouter
);

app.use(
  "/api/v1/",
  passport.authenticate(["jwt"], { session: true }),
  messageRouter
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
