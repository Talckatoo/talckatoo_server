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
} = require("../controllers/message-controller");

router.route("/conversations").get(getConversations);
router.route("/conversations/:conversationId").get(getConversation);
router.route("/messages").get(getMessages).post(createMessage);
router
  .route("/messages/:messageId")
  .get(getMessage)
  .patch(editMessage)
  .delete(deleteMessage);

export {};
module.exports = router;
