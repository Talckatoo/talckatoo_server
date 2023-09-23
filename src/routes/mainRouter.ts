const express = require("express");
const router = express.Router();
const { mainController } = require("../controllers/mainController");

/**
 * @swagger
 * /api/v1/:
 *   get:
 *     summary: Get main controller
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
 *         description: Successfully
 *       '401':
 *         description: Unauthorized
 */
router.route("/").get(mainController);

export {};
module.exports = router;
