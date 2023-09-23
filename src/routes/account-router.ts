const express = require("express");
const router = express.Router();
import { Request, Response, NextFunction } from "express";

const { signUp, logIn, logOut } = require("../controllers/account-controller");
/**
 * @swagger
 * /api/v1/account/sign-up:
 *   post:
 *     summary: Sign up a new user
 *     tags: [Account]
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
 *     responses:
 *       '200':
 *         description: Successfully signed up
 *       '400':
 *         description: Bad request
 */
router.route("/sign-up").post(signUp);
/**
 * @swagger
 * /api/v1/account/log-in:
 *   post:
 *     summary: Log in an existing user
 *     tags: [Account]
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
 *     responses:
 *       '200':
 *         description: Successfully logged in
 *       '401':
 *         description: Unauthorized
 */

router.route("/logout").post(logOut);

export {};
module.exports = router;
