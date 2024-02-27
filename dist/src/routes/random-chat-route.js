"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express = require("express");
const router = express.Router();
const { createRandomConversation } = require("../controllers/random-chats");
router.post("/", createRandomConversation);
module.exports = router;
