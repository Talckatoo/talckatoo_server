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

router.route("/conversations").get(getConversations);
router.route("/conversations/:conversationId").get(getConversation);
router.route("/messages").get(getMessages).post(createMessage);
router.route("/messages/voice-note").post(createVoiceNote);
router
  .route("/messages/:messageId")
  .get(getMessage)
  .patch(editMessage)
  .delete(deleteMessage);
router.route("/messages/voice-note/:messageId").delete(deleteVoiceNote);
// router.route("/messages/voice-translate").post(createVoiceTranslate);

export {};
module.exports = router;
