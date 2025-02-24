// types of the req, res and next...
import { Request, Response, NextFunction } from "express";
import swaggerDocs from "./utils/swagger";
//
const express = require("express");
const app = express();
const favicon = require("express-favicon");
const logger = require("morgan");
const session = require("express-session");
const passport = require("./utils/passport-config");
const mainRouter = require("./src/routes/mainRouter");
const messageRouter = require("./src/routes/message-router");
const accountRouter = require("./src/routes/account-router");
const groupsRoute = require("./src/routes/group-conversation-route");
const RandomChats = require("./src/routes/random-chat-route");
const swaggerUi = require("swagger-ui-express");
const catchAsync = require("./utils/catch-async");
app.use(express.json());
// const authRouter = require("./routes/auth-router");
const userRouter = require("./src/routes/user-router");
import uploadRouter from "./src/routes/upload-router";
const cryptoRouter = require("./src/routes/crypto-router");
const { globalErrorHandler } = require("./src/controllers/error-controller");
const port: number = Number(process.env.PORT) || 8000;
import multer from "multer";
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });
const checkIpAddress = require("./middleware/checkIpAddress");

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
app.use(upload.single("file"));

// routes

/**
 * @swagger
 * /:
 * get:
 *   tag:
 *    -
 *    description: Responds if the app is up and running
 *    responses:
 *      200:
 *        description: App is up and running
 */

// only allow access from Cloudflare IP or localhost
app.use(checkIpAddress);

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
  "/api/v1",
  passport.authenticate(["jwt"], { session: true }),
  uploadRouter
);

app.use(
  "/api/v1/",
  passport.authenticate(["jwt"], { session: true }),
  messageRouter
);
app.use(
  "/api/v1/groups",
  passport.authenticate(["jwt"], { session: true }),
  groupsRoute
);
app.use(
  "/api/v1/random-chats",
  passport.authenticate(["jwt"], { session: true }),
  RandomChats
);
app.use(
  "/api/v1/keys",
  passport.authenticate(["jwt"], { session: true }),
  cryptoRouter
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
