import express from "express";
import {
  handleFriendRequestResponse,
  sendFriendRequest,
} from "../controllers/friendRequest.controller";

const router = express.Router();

// route for sending a friend request
router.post("/send", sendFriendRequest);

// route for accepting or rejecting a friend request
router.post("/action", handleFriendRequestResponse);

export default router;
