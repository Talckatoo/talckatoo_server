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

export {};
module.exports = router;
