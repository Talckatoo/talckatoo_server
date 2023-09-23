const express = require("express");
const router = express.Router();
const { mainController } = require("../controllers/mainController");

/**
 * @swagger
 * /api/v1/:
 *   get:
 *     summary: base URL
 *     tags: [Base]
 *     responses:
 *       '200':
 *         description: Successfully
 *       '401':
 *         description: Unauthorized
 */
router.route("/").get(mainController);

export {};
module.exports = router;
