const express = require("express");
const router = express.Router();
import { Request, Response, NextFunction } from "express";

const {
  getUsers,
  getUser,
  getUserConversations,
  getUserConversation,
  updateProfile,
} = require("../controllers/user-controller");

router.route("/").get(getUsers);
router.route("/:userId/update-user").patch(updateProfile);
router.route("/:userId").get(getUser);
router.route("/:userId/conversations").get(getUserConversations);
router.route("/:userId/conversations/:conversationId").get(getUserConversation);

export {};
module.exports = router;
