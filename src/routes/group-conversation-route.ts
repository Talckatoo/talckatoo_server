const express = require("express");
const router = express.Router();
const {
  createGroup,
  joinGroup,
  getUserGroups,
} = require("../controllers/group-conversation-controller");
const {
  createGroupMessage,
  getGroupMessages,
} = require("../controllers/group-message-controller");

router.route("/:userId").post(createGroup);
router.route("/:userId").get(getUserGroups);
router.route("/:conversationId/join-group/:userId").patch(joinGroup);
//group messages
router.route("/message/:conversationId/:userId").post(createGroupMessage);
router.route("/message/:conversationId").get(getGroupMessages);

export {};
module.exports = router;
