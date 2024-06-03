const express = require("express");
const router = express.Router();
import { Request, Response, NextFunction } from "express";

const { getKeys } = require("../controllers/crypto-controller");

router.route("/:userId").get(getKeys);

module.exports = router;
