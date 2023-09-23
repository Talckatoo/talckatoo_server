const express = require("express");
const router = express.Router();
import { Request, Response, NextFunction } from "express";

const { signUp, logIn, logOut } = require("../controllers/account-controller");
/**
 * @swagger
 * components:
 *  schemas:
 *    User:
 *      type: object
 *      properties:
 *        id:
 *          type: string
 *        userName:
 *          type: string
 *          minLength: 5
 *        email:
 *          type: string
 *          format: email
 *        password:
 *          type: string
 *          minLength: 5
 *        language:
 *          type: string
 *        welcome:
 *          type: string
 *      example:
 *        id: 343234535546546556
 *        userName: "test123456"
 *        email: "test123456@gmail.com"
 *        password: "test123456"
 *        language: "en"
 *        welcome: "hello"
 */

/**
 * @swagger
 *  /account/sign-up:
 *    post:
 *      summary: Sign up a new user
 *      tags: [Account]
 *      requestBody:
 *        required: true
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/User' # Reference the User schema
 *      responses:
 *        200:
 *          description: User successfully signed up
 *          content:
 *            application/json:
 *              schema:
 *                type: object
 *                items:
 *                  $ref: '#/components/schemas/User'
 *        400:
 *         description: Bad request
 */
router.route("/sign-up").post(signUp);
/**
 * @swagger
 * /account/log-in:
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
router.route("/log-in").post(logIn);

router.route("/logout").post(logOut);

export {};
module.exports = router;
