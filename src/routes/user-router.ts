const express = require("express");
const router = express.Router();
import { Request, Response, NextFunction } from "express";

const {
  getUserConversations,
  getUserConversation,
} = require("../controllers/user-controller");

router.route("/:userId/conversations").get(getUserConversations);
router.route("/:userId/conversations/:conversationId").get(getUserConversation);

export {};
module.exports = router;
