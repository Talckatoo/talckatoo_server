const express = require("express");
const router = express.Router();
import { Request, Response, NextFunction } from "express";

import { getFriends } from "../controllers/user-controller";

const { createRandomConversation } = require("../controllers/random-chats");

router.post("/", createRandomConversation);

export {};
module.exports = router;
