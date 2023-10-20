const express = require("express");
const router = express.Router();
import { Request, Response, NextFunction } from "express";
import {
  getFriendRequests,
  handleFriendRequestResponse,
  sendFriendRequest,
} from "../controllers/friendRequest.controller";

const {
  getUsers,
  getUser,
  getUserConversations,
  getUserConversation,
  editUserConversation,
  updateProfile,
} = require("../controllers/user-controller");

/**
 * @swagger
 * /users:
 *   get:
 *     summary: Get all users
 *     tags: [User]
 *     responses:
 *       '200':
 *         description: Successful
 *       '401':
 *         description: Unauthorized
 */
router.route("/").get(getUsers);

// get all friend requests by user id
router.get("/requests", getFriendRequests);
/**
 * @swagger
 * /users/:userId:
 *   get:
 *     summary: Get user
 *     tags: [User]
 *     responses:
 *       '200':
 *         description: Successful
 *       '401':
 *         description: Unauthorized
 */
router.route("/:userId").get(getUser);
/**
 * @swagger
 * /users/:userId/update-user:
 *   patch:
 *     summary: Update Profile
 *     tags: [User]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *               language:
 *                 type:string
 *     responses:
 *       '200':
 *         description: Successfully logged in
 *       '401':
 *         description: Unauthorized
 */
router.route("/:userId/update-user").patch(updateProfile);

/**
 * @swagger
 * /users/:userId/conversations:
 *   get:
 *     summary: Get all user's conversation
 *     tags: [Conversation]
 *     responses:
 *       '200':
 *         description: Successful
 *       '401':
 *         description: Unauthorized
 */
router.route("/:userId/conversations").get(getUserConversations);

/**
 * @swagger
 * /users/:userId/conversations:conversationId:
 *   get:
 *     summary: Get one conversation
 *     tags: [Conversation]
 *     responses:
 *       '200':
 *         description: Successful
 *       '401':
 *         description: Unauthorized
 */
router.route("/:userId/conversations/:conversationId").get(getUserConversation);
router
  .route("/:userId/conversations/:conversationId/update")
  .get(editUserConversation);

// route for sending a friend request
router.post("/send", sendFriendRequest);

// route for accepting or rejecting a friend request
router.post("/action", handleFriendRequestResponse);
export {};
module.exports = router;
