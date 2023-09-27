const express = require("express");
const router = express.Router();

const {
  getConversations,
  getConversation,
  getMessages,
  getMessage,
  createMessage,
  editMessage,
  deleteMessage,
  createVoiceNote,
  deleteVoiceNote,
  createVoiceTranslate,
} = require("../controllers/message-controller");

/**
 * @swagger
 * /conversations:
 *   get:
 *     summary: Get all conversations
 *     tags: [Conversation]
 *     responses:
 *       '200':
 *         description: Successful
 *       '401':
 *         description: Unauthorized
 */
router.route("/conversations").get(getConversations);
/**
 * @swagger
 * /conversations/:conversationId:
 *   get:
 *     summary: Get conversation
 *     tags: [Conversation]
 *     responses:
 *       '200':
 *         description: Successful
 *       '401':
 *         description: Unauthorized
 */
router.route("/conversations/:conversationId").get(getConversation);

/**
 * @swagger
 * /messages:
 *   get:
 *     summary: Get all messages
 *     tags: [Message]
 *     responses:
 *       '200':
 *         description: Successful
 *       '401':
 *         description: Unauthorized
 */
/**
 * @swagger
 * /messages:
 *   post:
 *     summary: Create message
 *     tags: [Message]
 *     responses:
 *       '201':
 *         description: Successful
 *       '401':
 *         description: Unauthorized
 */

router.route("/messages").get(getMessages).post(createMessage);
/**
 * @swagger
 * /messages/:messageId:
 *   get:
 *     summary: Get message
 *     tags: [Message]
 *     responses:
 *       '200':
 *         description: Successful
 *       '401':
 *         description: Unauthorized
 */
/**
 * @swagger
 * /messages/:messageId:
 *   patch:
 *     summary: Edit message
 *     tags: [Message]
 *     responses:
 *       '200':
 *         description: Successful
 *       '401':
 *         description: Unauthorized
 */
/**
 * @swagger
 * /messages/:messageId:
 *   delete:
 *     summary: Delete message
 *     tags: [Message]
 *     responses:
 *       '200':
 *         description: Successful
 *       '401':
 *         description: Unauthorized
 */
router
  .route("/messages/:messageId")
  .get(getMessage)
  .patch(editMessage)
  .delete(deleteMessage);

/**
 * @swagger
 * /messages/voice-note:
 *   post:
 *     summary: Create voice message
 *     tags: [Message]
 *     responses:
 *       '201':
 *         description: Successful
 *       '401':
 *         description: Unauthorized
 */
router.route("/messages/voice-note").post(createVoiceNote);

/**
 * @swagger
 * /messages/voice-note/:messageId:
 *   delete:
 *     summary: Delete voice message
 *     tags: [Message]
 *     responses:
 *       '200':
 *         description: Successful
 *       '401':
 *         description: Unauthorized
 */
router.route("/messages/voice-note/:messageId").delete(deleteVoiceNote);

export {};
module.exports = router;
